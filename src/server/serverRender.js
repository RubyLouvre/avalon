function serverRender(vm, str) {
    var vdom = avalon.lexer(str)
    var templates = {}
    collectTemplate(vdom, templates)
    var oldTree = avalon.speedUp(vdom)
    var render = avalon.render(oldTree)
    var vtree = render(vm)
    var html = avalon.vdom(vtree, 'toHTML', false)
    return {
        templates: templates,
        html: html
    }
}

function collectTemplate(vdoms, obj) {
    for (var i = 0, el; el = vdoms[i++]; ) {
        var props = el.props
        if (props) {
            var id = props['ms-controller'] || props['ms-important']
            if (id) {
                obj[id] = VElement.prototype.toHTML.call(el, true)
                continue
            }
        }
        if (el.children) {
            collectTemplate(el.children, obj)
        }
    }
}

//重写4大构造器,用于生成更少的HTML
function VElement(type, props, children) {
    this.nodeName = type
    this.props = props
    this.children = children
}

function classNames() {
    var classes = []
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i]
        var argType = typeof arg
        if (argType === 'string' || argType === 'number' || arg === true) {
            classes.push(arg)
        } else if (Array.isArray(arg)) {
            classes.push(classNames.apply(null, arg))
        } else if (argType === 'object') {
            for (var key in arg) {
                if (arg.hasOwnProperty(key) && arg[key]) {
                    classes.push(key)
                }
            }
        }
    }

    return classes.join(' ')
}
//toHTML有两种模式 page模式与模板模式
//page模式就是将数据塞进模板中,并去掉所有ms-*(除了ms-controller, ms-imporant)属性与注释占位符

VElement.prototype = {
    constructor: VElement,
    toHTML: function (dir) {
        var arr = []
        var props = this.props || {}

        var attr = this['ms-attr']
        if (attr && typeof attr === 'object') {
            if (Array.isArray(attr)) {//转换成对象
                attr = avalon.mix.apply({}, attr)
            }
            for (var i in attr) {
                props[i] = attr[i]
                if (!attr[i]) {
                    delete props[i]
                }
            }
        }
        var cls = this['ms-class']
        if (cls) {
            var oldClass = props['class'] || ''
            var newClass = classNames(cls)
            var classArray = []
            var uniq = {}
            String(oldClass + ' ' + newClass).replace(/\S+/g, function (i) {
                if (!uniq[i]) {
                    uniq[i] = 1
                    classArray.push(i)
                }
            })
            props['class'] = classArray.join(' ')
        }

        for (var i in props) {
            var val = props[i]
            if (i.charAt(0) === ':') {
                continue
            }
            if (i.indexOf('ms-') === 0) {
                if (dir) {
                    arr.push(i.replace(/^ms\-/, ':') + '=' + avalon.quote(val + ''))
                } else {
                    if (i === 'ms-controller' || i === 'ms-important') {
                        arr.push(i + '=' + avalon.quote(val + ''))
                    }
                    continue
                }
            } else {
                arr.push(i + '=' + avalon.quote(val + ''))
            }
        }

        arr = arr.length ? ' ' + arr.join(' ') : ''
        var str = '<' + this.nodeName + arr
        if (this.isVoidTag) {
            return str + '/>'
        }
        str += '>'
        if (this.children) {
            str += this.children.map(function (c) {
                return c ? avalon.vdom(c, 'toHTML', dir) : ''
            }).join('')
        }
        return str + '</' + this.nodeName + '>'
    }
}


function VComment(text) {
    this.nodeName = '#comment'
    this.nodeValue = text
}
VComment.prototype = {
    constructor: VComment,
    toHTML: function () {
        return '<!--' + this.nodeValue + '-->' + (this.template || "")
    }
}
function VText(text) {
    this.nodeName = '#text'
    this.nodeValue = text
}

VText.prototype = {
    constructor: VText,
    toHTML: function () {
        return this.nodeValue
    }
}

function VFragment(a) {
    this.nodeName = '#document-fragment'
    this.children = a
}

VFragment.prototype = {
    constructor: VFragment,
    toHTML: function (dir) {
        return this.children.map(function (a) {
            return avalon.vdom(a, 'toHTML', dir)
        }).join('')
    }
}


avalon.vdom = function (obj, method, dir) {
    switch (obj.nodeName) {
        case '#text':
            return VText.prototype[method].call(obj)
        case '#comment':
            return VComment.prototype[method].call(obj)
        case '#document-fragment':
            return VFragment.prototype[method].call(obj, dir)
        case void(0):
            return (new VFragment(obj))[method]()
        default:
            return VElement.prototype[method].call(obj, dir)
    }
}

module.exports = serverRender