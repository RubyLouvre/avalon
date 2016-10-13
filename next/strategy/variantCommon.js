var rmsForBegin = /^\s*ms\-for\:\s*/
var rmsForEnd = /^\s*ms\-for\-end/
export default function variantCommon(array) {
        variantChildren(array)
        return array
}

function variantChildren(children) {
        var array = []
        for (var i = 0, el; el = children[i++];) {
                var isComment = el.nodeName === '#comment'
                if (isComment) {
                        if (rmsForBegin.test(el.nodeValue)) {
                                //压入新数组，让它收集元素
                                array = pressIn(array, el, [])
                        } else if (rmsForEnd.test(el.nodeValue)) {
                                var begin = array.begin
                                makeRange(begin, array, el)
                                //弹出新数组，用之前的数组来收集元素
                                array = popup(array, el)
                        } else {
                                array.push(el)
                        }
                } else {
                        array.push(el)
                        //处理元素节点
                        if (/^[\w_]+$/.test(el.nodeName || '')) {
                                variantProps(el)
                        }

                }
        }
        children.length = 0
        children.push.apply(children, array)

}

function variantProps(node) {
        var nodeName = node.nodeName
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
                        } else {
                                node.children = []
                        }
                }

        }

        node.props = props
        if (node.children) {
                variantChildren(node.children)
        }

}

function makeRange(begin, range, end) {
        var uuid = begin.signature || (begin.signature = avalon.makeHashCode('for'))
        end.signature = uuid
        end.dynamic = true
        begin.forExpr = begin.nodeValue.replace(rmsForBegin, '')
        if (range.length === 1) {
                var elem = range[0]
                var props = elem.props
                if (props) {//如果是元素节点
                        if (props.slot) {
                                begin.props = '{slot: "' + props.slot + '"}'
                        }
                        var cb = props['data-for-rendered']
                        if (cb) {
                                delete props['data-for-rendered']
                                var wid = cb + ':cb'
                                if (!avalon.caches[wid]) {
                                        avalon.caches[wid] = Function('return ' + avalon.parseExpr({
                                                type: 'on',
                                                expr: cb
                                        }))()
                                }
                                begin.wid = wid
                        }
                }
        }
        for (var j = 0; j < range.length; j++) {
                var el = range[j]
                var dom = el.dom
                if (dom && dom.parentNode) {//移除真实节点
                        dom.parentNode.removeChild(dom)
                }
        }
        begin.hasEffect = hasEffect(range)
        variantChildren(range)
        if (!avalon.caches[uuid]) {
            var children = range.concat()
            range.length = 0
            range.push({
                nodeName:'#document-fragment',
                children: children
            })
        }
}
//将循环区域变成一个数组,然后再转换成一个方法
function pressIn(arr, el, list) {
        list.list = arr
        list.begin = el
        el['ms-for'] = list
        arr.push(el)
        return list
}
function popup(arr, el) {
        var list = arr.list
        list.push(el)
        delete arr.list
        delete arr.begin
        return list
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
