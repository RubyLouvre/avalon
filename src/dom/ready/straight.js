var createMap = /native code/.test(Object.create) ? function () {
    return Object.create(null)
} : function () {
    return {}
}

var voidTag = avalon.oneObject("area,base,basefont,br,col,command,embed,hr,img,input,link,meta,param,source,track,wbr")

function getAttributes(node) {
    var attrs = node.attributes, ret = createMap()
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i]
        if (attr.specified) {
            ret[attr.name] = attr.value
        }
    }
    if (/input|textarea|select/i.test(node.nodeName)) {
        ret.type = node.type
    }
    var style = node.style.cssText
    if (style) {
        ret.style = style
    }
    var className = node.className
    if (className) {
        ret.staticClass = className
    }
    //类名 = 去重(静态类名+动态类名+ hover类名? + active类名)
    if (ret.type === 'select-one') {
        ret.selectedIndex = node.selectedIndex
    }
    return ret
}

function toHTML(a) {
    return avalon.vdomAdaptor(a, 'toHTML')
}
function createVDOM(node) {
    var ret = createMap()
    var type = node.nodeName.toLowerCase()
    ret.nodeName = type
    ret.nodeType = node.nodeType
    ret.dom = node
    if (ret.nodeType === 1) {
        ret.props = getAttributes(node)
        ret.children = createVDOMs(node.childNodes, node)
        if (voidTag[type]) {
            ret.isVoidTag = true
        }
        if ('selectedIndex' in ret) {
            node.selectedIndex = ret.selectedIndex
        }
    } else {
        ret.nodeValue = node.nodeValue
    }
    return ret
}
//根据 outerHTML 创建 虚拟DOM
function render(node) {
    return createVDOMs([node], null)
}
function createVDOMs(nodes, parent) {
    var arr = []
    nodes = avalon.slice(nodes)
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i]
        switch (node.nodeType) {
            case 1:
                var value = node.getAttribute('ms-for')
                if (value) {
                    var start = document.createComment('ms-for:' + value)
                    var end = document.createComment('ms-for-end:')
                    node.removeAttribute('ms-for')
                    if (parent) {
                        parent.replaceChild(end, node)
                        parent.insertBefore(start, end)
                    }
                    arr = createStartRepeat(arr, start)//返回新数组
                    arr.push(createVDOM(node))
                    arr = markeRepeatRange(arr, end) //返回旧数组

                } else {
                    arr.push(createVDOM(node))
                }
                break
            case 3:
                if (/\S/.test(node.nodeValue)) {
                    arr.push(createVDOM(node))
                } else {
                    removeNode(node)
                }
                break
            case 8:
                if (node.nodeValue.indexOf('ms-for:')) {
                    arr = createStartRepeat(arr, node)
                } else if (node.nodeValue.indexOf('ms-for-end:')) {
                    arr = createEndRepeat(arr, node)
                } else {
                    arr.push(createVDOM(node))
                }
        }
    }
    return arr
}
var f = avalon.avalonFragment
function removeNode(node) {
    f.appendChild(node)
    f.removeChild(node)
    return node
}
function createStartRepeat(arr, node) {
    var start = createVDOM(node)
    start.signature = avalon.makeHashCode('for')
    start.dynamic = 'for'
    var newArr = []
    arr.push(start, newArr)// start, [  ], end
    newArr.arr = arr
    newArr.start = start
    return newArr
}

function createEndRepeat(arr, end) {
    var start = arr.start
    var old = arr
    arr = arr.arr
    var end = createVDOM(end)
    end.dynamic = true
    end.signature = start.signature
    start.template = toHTML(old)
    if (old.length === 1) {
        var element = old[0]
        if (element.props) {
            var cb = element.props['data-for-rendered']
            if (cb) {
                var wid = cb + ':cb'
                if (!avalon.caches[wid]) {
                    avalon.caches[wid] = Function('return ' + avalon.parseExpr(cb, 'on'))()
                }
                start.wid = wid
            }
        }
    }
    for (var j = 0; j < old.length; j++) {
        removeNode(old[j])
    }
    return arr
}

module.exports = render

avalon.speedUp = function (arr) {
    for (var i = 0; i < arr.length; i++) {
        hasDirective(arr[i])
    }
    return arr
}

function hasDirective(a) {
    switch (a.nodeType) {
        case 3:
            if (avalon.config.rbind.test(a.nodeValue)) {
                a.dynamic = 'expr'
                return true
            } else {
                a.skipContent = true
                return false
            }
        case 8:
            if (a.dynamic) {
                return true
            } else {
                a.skipContent = true
                return false
            }
        case 1:
            if (a.props['ms-skip']) {
                a.skipContent = true
                return false
            }
            if (/^ms\-/.test(a.nodeName) || hasDirectiveAttrs(a.props)) {
                a.dynamic = true
            } 
            if (a.isVoidTag && !a.dynamic) {
                a.skipContent = true
                return false
            }
            var hasDirective = childrenHasDirective(a.children)
            if (!hasDirective && !a.dynamic) {
                a.skipContent = true
                return false
            }
            return true
        default:
            if (Array.isArray(a)) {
                return childrenHasDirective(a)
            }
    }
}

function childrenHasDirective(arr) {
    var ret = false
    for (var i = 0, el; el = arr[i++]; ) {
        if (hasDirective(el)) {
            ret = true
        }
    }
    return ret
}
var rdirAttr = /^(\:|ms\-)\w/
function hasDirectiveAttrs(props) {
    if ('ms-skip' in props)
        return false
    for (var i in props) {
        if (rdirAttr.test(i)) {
            return true
        }
    }
    return false
}
