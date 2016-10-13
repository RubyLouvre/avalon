var rmsForStart = /^\s*ms\-for\:\s*/
var rmsForEnd = /^\s*ms\-for\-end/
export default function variantCommon(array) {
        hasDirectives(array)
        return array
}

var hasDirectives = function (arr) {
        var nodes = []
        for (var i = 0; i < arr.length; i++) {
                var el = arr[i]
                var isComment = el.nodeName === '#comment'
                if (isComment && rmsForStart.test(el.nodeValue)) {
                        //在startRepeat节点前添加一个数组,收集后面的节点
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

                        start.forExpr = start.nodeValue.replace(rmsForStart, '')
                        if (old.length === 1) {
                                var element = old[0]
                                if (element.props) {
                                        if (element.props.slot) {
                                                start.props = '{slot: "' + element.props.slot + '"}'
                                        }
                                        var cb = element.props['data-for-rendered']
                                        if (cb) {
                                                delete element.props['data-for-rendered']
                                                var wid = cb + ':cb'
                                                if (!avalon.caches[wid]) {
                                                        avalon.caches[wid] = Function('return ' + avalon.parseExpr({
                                                                type: 'on',
                                                                expr: cb
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
                        hasDirectives(old)
                        if (!avalon.caches[uuid]) {
                                avalon.caches[uuid] = serializeChildren(old, true)
                        }
                        old.length = 0
                } else {
                        variantProps(el, noSkip)
                        nodes.push(el)
                }
        }
        arr.length = 0
        arr.push.apply(arr, nodes)
}

function variantProps(node) {
        var nodeName = node.nodeName
        if (nodeName && nodeName.charAt(0) !== '#') {
                var props = node.props, emptyProps
                if (!props) {
                        emptyProps = true
                        props = {}
                }

                if ('ms-skip' in props) {
                        node.skipContent = true
                        return false
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
                        if (props['ms-widget']) {
                                //有widget无html, text
                                delDir(props, 'html', 'widget')
                                delDir(props, 'text', 'widget')
                                var clone = avalon.mix({}, node)
                                var cprops = avalon.mix({}, node.props)
                                delete cprops['ms-widget']
                                delete clone.isVoidTag
                                clone.nodeName = "cheng"
                                clone.props = cprops
                                node.template = avalon.vdom(clone, 'toHTML')
                                if (!node.isVoidTag)
                                        node.children = []
                        } else if (props['ms-text']) {
                                delDir(props, 'html', 'text')
                                if (!node.isVoidTag) {
                                     node.children = []
                                }
                        } else if (props['ms-html']) {
                                if (node.isVoidTag) {
                                     delete props['ms-html']
                                }else{
                                     node.children = []
                                }
                        }

                }

                node.props = props
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
        for (var i = 0, el; el = arr[i++];) {
                if (el.props && el.props['ms-effect']) {
                        return true
                }
        }
        return false
}
