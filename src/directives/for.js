import { avalon, createFragment } from '../seed/core'
import { addScope, makeHandle } from '../parser/index'
import { handleDispose } from '../vtree/diff'

var rforAs = /\s+as\s+([$\w]+)/
var rident = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/
var rinvalid = /^(null|undefined|NaN|window|this|\$index|\$id)$/
var rargs = /[$\w_]+/g
avalon.directive('for', {
    delay: true,
    priority: 3,
    parse: function() {
        var str = this.expr,
            asName
        str = str.replace(rforAs, function(a, b) {
            /* istanbul ignore if */
            if (!rident.test(b) || rinvalid.test(b)) {
                avalon.error('alias ' + b + ' is invalid --- must be a valid JS identifier which is not a reserved name.')
            } else {
                asName = b
            }
            return ''
        })

        var arr = str.split(' in ')
        var kv = arr[0].match(rargs)
        if (kv.length === 1) { //确保avalon._each的回调有三个参数
            kv.unshift('')
        }
        this.expr = arr[1]
        this.keyName = kv[0]
        this.valName = kv[1]
        this.asName = asName || ''
        delete this.param
    },


    diff: function(oldVal, newVal) {
        var traceIds = createTrackIds(newVal)
        if (!oldVal.length) {
            oldVal.trackIds = traceIds
            oldVal.same = false
            oldVal.push.apply(oldVal, newVal)

            return 1
        } else if (oldVal.trackIds !== traceIds) {
            oldVal.same = false
            oldVal.trackIds = traceIds
            return 2
        } else {
            oldVal.same = true
            return 3
        }

    },
    update: function(oldVal, newVal, oldChild, newChild, i, afterCb) {

        if (oldVal.same) {
            //如果元素个数一致,则只需单纯将循环区域里的节点抽取出来,
            //同步到父节点的children中

            var args1 = oldVal.cachedArgs || getFlattenNodes(oldVal, i)
            oldChild.splice.apply(oldChild, args1)
            var args2 = getFlattenNodes(newVal, i)
            newChild.splice.apply(newChild, args2)
            return
        } else if (oldVal.length === 0 || !oldVal.cache) {
            //将key保存到oldVal的cache里面,并且它们都共用相同的子节点
            var args3 = getFlattenNodes(oldVal, i, oldVal.cache = {})
            oldVal.cachedArgs = args3
            newChild.splice.apply(newChild, args3)
            oldChild.splice.apply(oldChild, args3)

        } else {
            var args4 = [i, 1]
            diffRepeatRange(oldVal, newVal, args4)
            oldVal.cachedArgs = args4
            oldChild.splice.apply(oldChild, args4)
            var args5 = getFlattenNodes(newVal, i)
            newChild.splice.apply(newChild, args5)
        }
        if (!oldVal.slot) {
            var comment = newChild[i - 1]
            var render = oldVal.cb
            var string = newVal.cb
            if (!render && string && string !== 'undefined') {
                var arr = addScope(string, 'for')
                var body = makeHandle(arr[0])
                render = oldVal.cb = new Function('$event', '$$l', 'var __vmodel__ = this\nreturn ' + body)
            }
            if (!render)
                return
            afterCb.push(function(vdom) {
                render.call(comment.vm, {
                    type: 'rendered',
                    target: vdom.dom
                }, comment.local)
            })
        }
    }
})


function createTrackIds(nodes) {
    var ids = []
    for (var i = 0, el; el = nodes[i++];) {
        ids.push(el.key)
    }
    return ids.join(';;')
}


function getFlattenNodes(nodes, i, cache) {
    var flattenNodes = [i, 1]
    nodes.forEach(function(el) {
        cache && saveInCache(cache, el)
        if (el.nodeName === '#document-fragment') {
            el.children.forEach(function(elem) {
                flattenNodes.push(elem)
            })
        } else {
            flattenNodes.push(el)
        }
    })
    return flattenNodes
}
//比如两个循环区域, 重写oldVal的cache与它的部分元素
function diffRepeatRange(oldVal, newVal, flattenNodes) {
    var cache = oldVal.cache || {}
    var newCache = {}
    var fuzzy = []
        //标记它们都应该为移除
    oldVal.forEach(function(node) {
        node._dispose = true
    })

    newVal.forEach(function(node, index) {
        var cached = isInCache(cache, node.key)
            //取出之前的文档碎片
        if (cached) {
            delete cached._dispose
            cached.oldIndex = cached.index
            cached.index = index // 相当于 node.index
                //   cached.vm[instance.keyName] = instance.isArray ? index : cached.key
            saveInCache(newCache, cached)
        } else {
            //如果找不到就进行模糊搜索
            fuzzy.push(node)
        }
    })

    fuzzy.forEach(function(node) {
        var cached = fuzzyMatchCache(cache, node.key)
        if (cached) { //重复利用
            cached.oldIndex = cached.index
            cached.key = node.key
            var val = cached.val = node.val
            var index = cached.index = node.index
                //   cached.vm[instance.valName] = val
                //   cached.vm[instance.keyName] = instance.isArray ? index : cached.key
            delete cached._dispose
        } else {
            oldVal.push(node)
            cached = node
        }

        saveInCache(newCache, cached)
    })

    oldVal.sort(function(a, b) {
        return a.index - b.index
    })

    for (let el, i = 0; el = oldVal[i]; i++) {
        if (el._dispose) {
            handleDispose(el)
            oldVal.splice(i, 1);
            i--
        } else {
            if (el.nodeName === '#document-fragment') {
                flattenNodes.push.apply(flattenNodes, el.children)
            } else {
                flattenNodes.push(el)
            }
        }
    }
    oldVal.cache = newCache
}


// 新位置: 旧位置
function isInCache(cache, id) {
    var c = cache[id]
    if (c) {
        var arr = c.arr
            /* istanbul ignore if*/
        if (arr) {
            var r = arr.pop()
            if (!arr.length) {
                c.arr = 0
            }
            return r
        }
        delete cache[id]
        return c
    }
}
//[1,1,1] number1 number1_ number1__
function saveInCache(cache, component) {
    var trackId = component.key
    if (!cache[trackId]) {
        cache[trackId] = component
    } else {
        var c = cache[trackId]
        var arr = c.arr || (c.arr = [])
        arr.push(component)
    }
}

var rfuzzy = /^(string|number|boolean)/
var rkfuzzy = /^_*(string|number|boolean)/

function fuzzyMatchCache(cache) {
    var key
    for (var id in cache) {
        var key = id
        break
    }
    if (key) {
        return isInCache(cache, key)
    }
}

//https://github.com/youngwind/bue/tree/master/src/directives