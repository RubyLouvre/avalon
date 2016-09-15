/*
 * 调整VDOM的结构与属性
 */
var rmsForStart = /^\s*ms\-for\:\s*/
var rmsForEnd = /^\s*ms\-for\-end/
var serializeChildren = require('./serializeChildren')

module.exports = variantCommon
function variantCommon(array) {
    variantChildren(array)
    return array
}

function variantChildren(children) {
    var nodes = [] //临时使用的数组
    for (var i = 0; i < children.length; i++) {
        var el = children[i]
        var isComment = el.nodeName === '#comment'
        if (isComment && rmsForStart.test(el.nodeValue)) {
            //在startRepeat节点前添加一个数组,收集后面的节点
            nodes.push(el)
            var old = nodes
            nodes = []
            nodes.list = old
            nodes.start = el
        } else if (isComment && rmsForEnd.test(el.nodeValue)) {
            old = nodes
            nodes = old.list
            var start = old.start
            delete old.list
            delete old.start
            nodes.push(old, el)
            el.dynamic = true
            var uuid = start.signature || (start.signature = avalon.makeHashCode('for'))
            el.signature = uuid
            start.forExpr = start.nodeValue.replace(rmsForStart, '')
            if (old.length === 1) {
                var element = old[0]
                var props = element.props
                if (props) {
                    if (props.slot) {
                        start.props = '{slot: "' + props.slot + '"}'
                    }
                    var cb = props['data-for-rendered']
                    if (cb) {
                        delete props['data-for-rendered']
                        var wid = 'hook:' + cb
                        if (!avalon.caches[wid]) {
                            avalon.caches[wid] = Function('return ' + avalon.parseExpr({
                                expr: cb,
                                type: 'on'
                            }))()
                        }
                        start.wid = wid
                    }
                }
            }
            for (var j = 0; j < old.length; j++) {
                var el = old[j]
                var elem = el.dom
                if (elem && elem.parentNode) {//移除真实节点
                    elem.parentNode.removeChild(elem)
                }
            }
            start.hasEffect = hasEffect(old)
            variantChildren(old)
            if (!avalon.caches[uuid]) {
                avalon.caches[uuid] = serializeChildren(old, 0, 1)
            }
            old.length = 0
        } else {
            variantProps(el)
            nodes.push(el)
        }
    }
    children.length = 0
    children.push.apply(children, nodes)
}

function variantProps(node) {
    var nodeName = node.nodeName
    if (nodeName && nodeName.charAt(0) !== '#') {
        var props = node.props, emptyProps, emptyChildren
        if (!props) {
            emptyProps = true
            props = {}
        }
        if (nodeName === 'input') {
            if (!props.type) {
                props.type = 'text'
            }
        } else if (/xmp|wbr|template/.test(nodeName)) {
            if (!props['ms-widget'] && props.is) {
                props['ms-widget'] = '{is:"' + props.is + '"}'
                emptyProps = false
            }
        } else if (nodeName === 'select') {
            var postfix = props.hasOwnProperty('multiple') ? 'multiple' : 'one'
            props.type = nodeName + '-' + postfix
        } else if (nodeName.indexOf('ms-') === 0) {
            if (!props['ms-widget']) {
                props.is = nodeName
                props['ms-widget'] = '{is:"' + nodeName + '"}'
                emptyProps = false
            }
        }
        if (!emptyProps) {
            if ('ms-skip' in props) {
                node.skipContent = true
                return false
            }
            var emptyChildren
            if (props['ms-widget']) {
                //有widget无html, text
                delDir(props, 'html', 'widget')
                delDir(props, 'text', 'widget')
                delDir(props, 'duplex', 'widget')
                var cloneNode = avalon.mix({}, node)
                var cloneProps = avalon.mix({}, props)
                delete cloneProps['ms-widget']
                delete cloneNode.isVoidTag
                cloneNode.nodeName = "cheng"
                cloneNode.props = cloneProps
                node.template = avalon.vdom(cloneNode, 'toHTML')
                emptyChildren = true
            } else if (props['ms-text']) {
                //有text无html
                delDir(props, 'html', 'text')
                emptyChildren = true
            } else if (props['ms-html']) {
                if (node.isVoidTag) {
                    delete props['ms-html']
                } else {
                    emptyChildren = true
                }
            }
            if (emptyChildren && !node.isVoidTag) {
                node.children = []
            }
        }
        if (!avalon.isEmptyObject(props)) {
            node.props = props
        }
        if (node.children) {
            variantChildren(node.children)
        }
    }
}


function delDir(props, a, b) {
    if (props['ms-' + a]) {
        avalon.warn(a, '指令不能与', b, '指令共存于同一个元素')
        delete props['ms-' + a]
    }
}

function hasEffect(arr) {
    for (var i = 0, el; el = arr[i++]; ) {
        if (el.props && el.props['ms-effect']) {
            return true
        }
    }
    return false
}
