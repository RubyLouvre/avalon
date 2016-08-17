
var rmsForStart = /^\s*ms\-for\:/
var rmsForEnd = /^\s*ms\-for\-end/
var vdom2body = require('./vdom2body')
avalon.speedUp = function (array) {
    hasDirectives(array)
    return array
}

var hasDirectives = function (arr) {
    var nodes = [], hasDir = false
    for (var i = 0; i < arr.length; i++) {
        var el = arr[i]
        var isComment = el.nodeName === '#comment'
        if (isComment && rmsForStart.test(el.nodeValue)) {
            hasDir = true//在startRepeat节点前添加一个数组,收集后面的节点
            nodes.push(el)
            var old = nodes
            nodes = []
            nodes.list = old
            nodes.start = el
        } else if (isComment && rmsForEnd.test(el.nodeValue)) {
            var old = nodes
            nodes = old.list
            var start = old.start
            delete old.list
            delete old.start
            nodes.push(old, el)
            el.dynamic = true
            var uuid = start.signature || (start.signature = avalon.makeHashCode('for'))
            el.signature = uuid

            start.forExpr = start.nodeValue.replace(/ms\-for:\s*/, '')
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
                var el = old[j]
                if (el.dom) {//移除真实节点
                    removeNode(el.dom)
                }
            }
            start.hasEffect = hasEffect(old)
            hasDirectives(old)
            if (!avalon.caches[uuid]) {
                avalon.caches[uuid] = vdom2body(old, true)
            }
            old.length = 0
        } else {
            if (hasDirective(el)) {
                hasDir = true
            }
            nodes.push(el)
        }
    }
    arr.length = 0
    arr.push.apply(arr, nodes)
    return hasDir
}



function hasDirective(node) {

    var nodeName = node.nodeName
    switch (nodeName) {
        case '#text':
            if (avalon.config.rexpr.test(node.nodeValue)) {
                return node.dynamic = true
            } else {
                return false
            }
        case '#comment':
            if (node.dynamic) {
                return true
            }
            return false
        case void 0:
            return true
        default:
            var props = node.props || {}
            if ('ms-skip' in props) {
                node.skipContent = true
                return false
            }
            var flag = false
            if (nodeName === 'input') {
                if (!props.type) {
                    props.type = 'text'
                }
            } else if (nodeName === 'select') {
                var postfix = props.hasOwnProperty('multiple') ? 'multiple' : 'one'
                props.type = nodeName + '-' + postfix
            } else if (nodeName.indexOf('ms-') === 0) {
                if (!props['ms-widget']) {
                    props.is = nodeName
                    props['ms-widget'] = '{is:"' + nodeName + '"}'
                }
            }
            var childDir = false
            if (props['ms-widget']) {
                childDir = true
                delDir(props, 'html', 'widget')
                delDir(props, 'text', 'widget')
                var clone = avalon.mix({}, node)
                var cprops = avalon.mix({}, node.props)
                delete cprops['ms-widget']
                delete clone.isVoidTag
                clone.nodeName = "cheng"
                clone.props = cprops
                node.template = avalon.vdomAdaptor(clone, 'toHTML')
                if (!node.isVoidTag)
                    node.children = []
            }
            if (props['ms-text']) {
                childDir = true
                delDir(props, 'html', 'text')
                if (!node.isVoidTag) {
                    node.children = []
                }
            }
            if (props['ms-html']) {
                childDir = true
                if (!node.isVoidTag) {
                    node.children = []
                }
            }
            var hasProps = false
            for (var i in props) {
                hasProps = true
                if (i.indexOf('ms-') === 0) {
                    flag = true
                    node.dynamic = {}
                    break
                }
            }
            if (hasProps) {
                node.props = props
            }
            if (node.children) {
                var r = hasDirectives(node.children)
                if (r) {
                    delete node.skipContent
                    return true
                }
                if (!childDir) {
                    node.skipContent = true
                } else {
                    delete node.skipContent
                }
            }
            return flag
    }
}

function delDir(props, a, b) {
    if (props['ms-' + a]) {
        avalon.warn(a, '指令不能与', b, '指令共存于同一个元素')
        delete props['ms-' + a]
    }
}

var f = document.documentElement
function removeNode(node) {
    f.appendChild(node)
    f.removeChild(node)
    return node
}

function hasEffect(arr) {
    for (var i = 0, el; el = arr[i++]; ) {
        if (el.props && el.props['ms-effect']) {
            return true
        }
    }
    return false
}
