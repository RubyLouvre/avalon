var jsonfy = require('./jsonfy')
var serializeText = require('./serializeText')
module.exports = serializeChildren
var directives = avalon.directives
function serializeChildren(children, skip, isRepeat) {
    var lexeme = children.map(function (a) {
        var stem = serializeNode(a, skip)
        var suffix = a.suffix
        var prefix = a.prefix
        delete a.suffix
        delete a.prepend
        return {
            stem: stem,
            prefix: prefix,
            suffix: suffix
        }
    })

    var needWrapper = lexeme.some(hasFix)

    if (needWrapper || isRepeat) {
        var buffer = bufferChildren(lexeme)
        if (isRepeat) {
            return buffer.join('\n')
        }
        buffer.unshift('(function(){', 'var vnodes = []')
        buffer.push('return vnodes', '})()')
        return buffer.join('\n')
    } else {
        var nodes = []
        for (var i = 0, el; el = lexeme[i++]; ) {
            if (el.stem) {
                nodes.push(el.stem)
            }
        }
        return  '[' + nodes + ']'
    }
}

function bufferChildren(nodes) {
//ms-important， ms-controller ， ms-for 不可复制，省得死循环
//ms-important --> ms-controller --> ms-for --> ms-widget --> ms-effect --> ms-if
    var buffer = []
    for (var i = 0, node; node = nodes[i++]; ) {
        if (node.prefix) {
            buffer.push(node.prefix)
        }
        if (node.stem) {
            buffer.push(addTag(node.stem))
        }
        if (node.suffix) {
            buffer.push(node.suffix)
        }
    }
    return buffer
}

function serializeNode(node, skip) {
    switch (node.nodeName) {
        case void(0):
            return ''
        case '#text':
            return serializeText(node, skip)
        case '#comment':
            if (node.forExpr) {// 处理ms-for指令
                return serializeForStart(node, skip)
            } else if (!skip && node.nodeValue === 'ms-for-end:') {
                return serializeForEnd(node, skip)
            } else if (!skip && node.nodeValue.indexOf('ms-if:') === 0) {
                return serializeLogic(node, skip)
            } else {
                return jsonfy(node)
            }
        default:
            return serializeElement(node, skip)
    }
}


var alwaysDynamic = {'ms-html': 1, 'ms-widget': 1}
function serializeElement(vdom, skip) {
    var props = vdom.props
    var copy = {
        nodeName: vdom.nodeName
    }
    var dirs = []
    if (props && !skip) {
        skip = 'ms-skip' in props
        var bindings = skip ? [] : extractBindings(copy, props)
        if (bindings.length) {
            bindings.forEach(function (binding) {
                //将ms-*的值变成函数,并赋给copy.props[ms-*]
                //如果涉及到修改结构,则在vdom添加prefix, suffix
                directives[binding.type].parse(copy, vdom, binding)
                var name = binding.name
                if (typeof copy[name] === 'string') {
                    //如果存在局部变量,我们无法对它进行依赖检测,只能统统执行
                    var untraceable = !!binding.locals
                    var paths = alwaysDynamic[name] || untraceable ? '' : binding.paths
                    dirs.push(avalon.quote(paths), avalon.quote(name), copy[name])
                    delete copy[name]
                } else {
                    copy.dynamic = '{}'
                }
            })
            vdom.dynamic = {}
        }
    }
    if (vdom.isVoidTag) {
        copy.isVoidTag = true
    } else {
        if (!('children' in copy)) {
            var children = vdom.children
            if (Array.isArray(children)) {
                copy.children = serializeChildren(children, skip || !!vdom.skipContent)
            }
        }
    }
    if (vdom.template)
        copy.template = vdom.template
    if (vdom.skipContent)
        copy.skipContent = true
    return jsonfy(copy, dirs)
}

//判定目标对象是否拥有prefix, suffix
function hasFix(a) {
    return a.prefix || a.suffix
}

var skips = {__local__: 1, vmode: 1, dom: 1}

function serializeForStart(vdom) {
    var copy = {
        vmodel: '__vmodel__'
    }
    for (var i in vdom) {
        if (vdom.hasOwnProperty(i) && !skips[i]) {
            copy[i] = vdom[i]
        }
    }
    avalon.directives['for'].parse(copy, vdom, {})
    //为copy添加dynamic
    vdom.suffix += avalon.caches[vdom.signature] //vdom.template
    return jsonfy(copy)
}

function serializeForEnd(vdom) {
    vdom.suffix = addTag(jsonfy({
        nodeName: '#comment',
        nodeValue: vdom.signature

    })) +
            '\nreturn vnodes}\n })\n},__local__, vnodes)\n' +
            addTag(jsonfy({
                nodeName: "#comment",
                signature: vdom.signature,
                nodeValue: "ms-for-end:"
            })) + '\n'
    return ''
}
function addTag(a) {
    return 'vnodes.push(' + a + ')'
}

var rstatement = /^\s*var\s+([$\w]+)\s*\=\s*\S+/

function serializeLogic(vdom) {
    var nodeValue = vdom.nodeValue
    var statement = parseExpr({
        expr: nodeValue.replace('ms-js:', ''),
        type: 'js'
    })
    var match = statement.match(rstatement)
    if (match && match[1]) {
        vdom.suffix = (vdom.suffix || '') + statement +
                "\n__local__." + match[1] + ' = ' + match[1] + '\n'
    } else {
        avalon.warn(nodeValue + ' parse fail!')
    }
    return jsonfy(vdom)
}

var rbinding = /^(\:|ms\-)\w+/
var eventMap = avalon.oneObject('animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit')

function extractBindings(cur, props) {
    var bindings = []
    var attrs = {}
    var skip = 'ms-skip' in props//old
    var uniq = {}
    for (var i in props) {
        var value = props[i], match
        attrs[i] = props[i]
        if ((match = i.match(rbinding))) {
            /* istanbul ignore if  */
            if (skip)
                continue

            var arr = i.replace(match[1], '').split('-')

            if (eventMap[arr[0]]) {
                arr.unshift('on')
            }
            if (arr[0] === 'on') {
                arr[2] = parseFloat(arr[2]) || 0
            }
            arr.unshift('ms')
            var type = arr[1]
            if (directives[type]) {
                var binding = {
                    type: type,
                    param: arr[2],
                    name: arr.join('-'),
                    expr: value,
                    priority: directives[type].priority || type.charCodeAt(0) * 100
                }

                if (type === 'on') {
                    binding.priority += arr[3]
                }
                if (!uniq[binding.name]) {
                    uniq[binding.name] = value
                    bindings.push(binding)
                }
            }
        }
    }

    cur.props = attrs

    bindings.sort(byPriority)

    return bindings
}

function byPriority(a, b) {
    return a.priority - b.priority
}