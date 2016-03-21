
var refreshView = require('../strategy/patch')

avalon._each = function (obj, fn) {
    if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            var value = obj[i]
            var type = typeof value
            var key = value && type === 'object' ? obj.$hashcode : type + value
            fn(i, obj[i], key)
        }
    } else {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                fn(i, obj[i], i)
            }
        }
    }
}
var rforPrefix = /ms-for\:\s*/
var rforLeft = /^\s*\(\s*/
var rforRight = /\s*\)\s*$/
var rforSplit = /\s*,\s*/
avalon.directive('for', {
    parse: function (str, num) {
        var arr = str.replace(rforPrefix, '').split(' in ')
        var def = 'var loop' + num + ' = ' + avalon.parseExpr(arr[1]) + '\n'
        var kv = arr[0].replace(rforLeft, '').replace(rforRight, '').split(rforSplit)
        if (kv.length === 1) {
            kv.unshift('$key')
        }
        return def + 'avalon._each(loop' + num + ', function(' + kv + ', traceKey){\n\n'
    },
    diff: function (current, previous, i) {
        var cur = current[i]
        var pre = previous[i] || {}
        var hasSign1 = 'directive' in cur
        var hasSign2 = 'directive' in pre

        var curLoop = hasSign1 ? getForBySignature(current, i) :
                getForByNodeValue(current, i)

        var preLoop = pre.repeatVnodes
        if (!preLoop) {
            preLoop = hasSign2 ? getForBySignature(previous, i) :
                    getForByNodeValue(previous, i)
        }

        var n = curLoop.length - preLoop.length
        if (n > 0) {
            var spliceArgs = [i, 0]
            for (var j = 0; j < n; j++) {
                spliceArgs.push(null)
            }
            previous.splice.apply(previous, spliceArgs)
        } else {
            previous.splice.apply(previous, [i, Math.abs(n)])
        }
        cur.action = !hasSign2 ? 'replace' : 'reorder'

        cur.repeatVnodes = curLoop
        var ccom = cur.components = getForByKey(curLoop.slice(1, -1), cur.signature)

        if (cur.action === 'reorder') {
            var cache = {}
            var indexes = {}
            for (var i = 0, c; c = ccom[i++]; ) {
                saveInCache(cache, c)
            }
            var pcom = pre.components

            for (var i = 0, c; c = pcom[i++]; ) {
                var p = isInCache(cache, c.key)
                if (p) {
                    indexes[c.index] = p.index
                    avalon.diff(p.children, c.children)
                }
            }
            //这是新添加的元素
            for (var i in cache) {
                p = cache[i]
                indexes[p.index + '_'] = p
                avalon.diff(p.children, [])
            }
            cur.indexes = indexes
        }

        var list = cur.change || (cur.change = [])
        avalon.Array.ensure(list, this.update)
        return i + curLoop.length - 1

    },
    update: function (startRepeat, vnode, parent) {

        var repeatVnodes = vnode.repeatVnodes
        var nodes = vnode.repeatNodes
        var action = vnode.action
        var endRepeat = nodes[nodes.length - 1]
        var vnodes = repeatVnodes.slice(1, -1)

        if (action === 'replace') {
            var node = startRepeat.nextSibling
            while (node !== endRepeat) {
                parent.removeChild(node)
                node = startRepeat.nextSibling
            }
            var fragment = document.createDocumentFragment()
            vnodes.forEach(function (c) {
                fragment.appendChild(avalon.vdomAdaptor(c).toDOM())
            })

            var entity = avalon.slice(fragment.childNodes)
            avalon.diff(vnodes, [])
            parent.insertBefore(fragment, endRepeat)
            refreshView(entity, vnodes, parent)
        } else {
            var groupText = vnode.signature
            var indexes = vnode.indexes
            var emptyFragment = document.createDocumentFragment()
            var fragment = emptyFragment.cloneNode(false)

            var next, sortedFragments = {}, fragments = [],
                    i = 0, el
            while (next = startRepeat.nextSibling) {
                if (next === endRepeat) {
                    break
                } else if (next.nodeValue === groupText) {
                    fragment.appendChild(next)
                    if (indexes[i] !== void 0) {
                        sortedFragments[indexes[i]] = fragment
                        delete indexes[i]
                    } else {
                        fragments.push(fragment)//?
                    }
                    i++
                    fragment = emptyFragment.cloneNode(false)
                } else {
                    fragment.appendChild(next)
                }
            }

            for (i in indexes) {
                var com = indexes[i]
                i = parseFloat(i)
                sortedFragments[ i ] = componentToDom(com, emptyFragment.cloneNode(false))
            }

            for (i = 0, el; el = sortedFragments[i++]; ) {
                emptyFragment.appendChild(el)
            }

            var entity = avalon.slice(emptyFragment.childNodes)
            parent.insertBefore(emptyFragment, endRepeat)
            refreshView(entity, vnodes, parent)
        }

    }
})

function componentToDom(com, fragment) {
    com.children.forEach(function (c) {
        fragment.appendChild(avalon.vdomAdaptor(c).toDOM())
    })
    return fragment
}

//将要循环的节点根据锚点元素再分成一个个更大的单元,用于diff
function getForByKey(nodes, signature) {
    var components = []
    var com = {
        children: []
    }
    for (var i = 0, el; el = nodes[i]; i++) {
        if (el.type === '#comment' && el.nodeValue === signature) {
            com.children.push(el)
            com.key = el.key
            com.index = components.length
            components.push(com)
            com = {
                children: []
            }
        } else {
            com.children.push(el)
        }
    }
    return components
}

//从一组节点,取得要循环的部分(第二次生成的虚拟DOM树会走这分支)
function getForBySignature(nodes, i) {
    var start = nodes[i], node
    var endText = start.signature + ':end'
    var ret = []
    while (node = nodes[i++]) {
        ret.push(node)
        if (node.nodeValue === endText) {
            break
        }
    }
    return ret
}

//从一组节点,取得要循环的部分(初次生成的虚拟DOM树及真实DOM树会走这分支)
function getForByNodeValue(nodes, i) {
    var isBreak = 0, ret = [], node
    while (node = nodes[i++]) {
        if (node.type === '#comment') {
            if (node.nodeValue.indexOf('ms-for:') === 0) {
                isBreak++
            } else if (node.nodeValue.indexOf('ms-for-end:') === 0) {
                isBreak--
            }
        }
        ret.push(node)
        if (isBreak === 0) {
            break
        }
    }
    return ret
}

// 新 位置: 旧位置
function isInCache(cache, id) {
    var c = cache[id]
    if (c) {
        var stack = [{id: id, c: c}]
        while (1) {
            id += '_'
            if (cache[id]) {
                stack.push({
                    id: id,
                    c: cache[id]
                })
            } else {
                break
            }
        }
        var a = stack.pop()
        delete cache[a.id]
        return a.c
    }
    return c
}

function saveInCache(cache, component) {
    var trackId = component.key
    if (!cache[trackId]) {
        cache[trackId] = component
    } else {
        while (1) {
            trackId += '_'
            if (!cache[trackId]) {
                cache[trackId] = component
                break
            }
        }
    }
}
