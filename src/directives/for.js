import { avalon, createFragment, platform, isObject, ap } from '../seed/core'

import { VFragment } from '../vdom/VFragment'

import { addScope, makeHandle } from '../parser/index'


var rforAs = /\s+as\s+([$\w]+)/
var rident = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/
var rinvalid = /^(null|undefined|NaN|window|this|\$index|\$id)$/
var rargs = /[$\w_]+/g
avalon.directive('for', {
    delay: true,
    priority: 3,
    beforeInit: function() {
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
    init: function() {
        var cb = this.userCb
        if (typeof cb === 'string' && cb) {
            var arr = addScope(cb, 'for')
            var body = makeHandle(arr[0])
            this.userCb = new Function('$event', 'var __vmodel__ = this\nreturn ' + body)
        }
        this.node.forDir = this //暴露给component/index.js中的resetParentChildren方法使用
        this.fragment = ['<div>', this.fragment, '<!--', this.signature, '--></div>'].join('')
        this.cache = {}

    },

    diff: function(oldVal, newVal) {
        var traceIds = createTrackIds(newVal)
        if (oldVal.trackIds === void 0) {
            oldVal.trackIds = traceIds
            oldVal.same = false
            oldVal.length = 0
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
    update: function(oldVal, newVal, oldChild, newChild, i, p) {
        var flat = [i, 1]
            //将循环区域里的节点抽取出来,同步到父节点的children中
        if (oldVal.same) {
            var flat = oldVal.flat
            newChild.splice.apply(newChild, flat)
        } else if (oldVal.length === 0 || !oldVal.cache) {
            mountList(oldVal, oldVal.cache = {}, flat)
            newChild.splice.apply(newChild, flat)
            oldVal.flat = flat
        } else {
            diffList(oldVal, newVal, flat)
            var flat2 = [i, 1]
            mountList(newVal, null, flat2, true)
            newChild.splice.apply(newChild, flat2)
            oldVal.flat = flat
        }
        oldChild.splice.apply(oldChild, flat)

    },
    beforeDispose: function() {
        this.fragments.forEach(function(el) {
            el.dispose()
        })
    }
})


function createTrackIds(nodes) {
    var ids = []
    for (var i = 0, el; el = nodes[i++];) {
        ids.push(el.key)
    }
    return ids.join(';;')
}




function mountList(nodes, cache, flat, not) {
    nodes.forEach(function(el) {
        !not && saveInCache(cache, el)
        el.children.forEach(function(elem) {
            flat.push(elem)
        })
    })
}

function diffList(list, newNodes, flat) {
    var cache = list.cache
    var newCache = {}
    var fuzzy = []
        //标记它们都应该为移除
    list.forEach(function(el) {
        el._dispose = true
    })

    newNodes.forEach(function(c, index) {
        var fragment = isInCache(cache, c.key)
            //取出之前的文档碎片
        if (fragment) {
            delete fragment._dispose
            fragment.oldIndex = fragment.index
            fragment.index = index // 相当于 c.index
                //            fragment.vm[instance.keyName] = instance.isArray ? index : fragment.key
            saveInCache(newCache, fragment)
        } else {
            //如果找不到就进行模糊搜索
            fuzzy.push(c)
        }
    })

    fuzzy.forEach(function(c) {
        var fragment = fuzzyMatchCache(cache, c.key)
        if (fragment) { //重复利用
            fragment.oldIndex = fragment.index
            fragment.key = c.key
            var val = fragment.val = c.val
            var index = fragment.index = c.index
                //   fragment.vm[instance.valName] = val
                //   fragment.vm[instance.keyName] = instance.isArray ? index : fragment.key
            delete fragment._dispose
        } else {
            list.push(c)
            fragment = c
        }

        saveInCache(newCache, fragment)
    })

    list.sort(function(a, b) {
        return a.index - b.index
    })

    for (var el, i = 0; el = list[i]; i++) {
        if (el._dispose) {
            list.splice(i, 1)
                --i
        } else {
            flat.push.apply(flat, el.children)
        }
    }
    list.cache = newCache
}

function updateItemVm(vm, top) {
    for (var i in top) {
        if (top.hasOwnProperty(i)) {
            vm[i] = top[i]
        }
    }
}



function updateList(instance) {
    var before = instance.begin.dom
    var parent = before.parentNode
    var list = instance.fragments
    var end = instance.end.dom
    for (var i = 0, item; item = list[i]; i++) {
        if (item._dispose) {
            list.splice(i, 1)
            i--
            item.dispose()
            continue
        }
        if (item.oldIndex !== item.index) {
            var f = item.toFragment()
            parent.insertBefore(f, before.nextSibling || end)
        }
        before = item.split
    }
    var ch = instance.parentChildren
    var startIndex = ch.indexOf(instance.begin)
    var endIndex = ch.indexOf(instance.end)

    list.splice.apply(ch, [startIndex + 1, endIndex - startIndex].concat(list))
}


/**
 * 
 * @param {type} fragment
 * @param {type} this
 * @param {type} index
 * @returns { key, val, index, oldIndex, this, dom, split, vm}
 */
function FragmentDecorator(fragment, instance, index) {
    var data = {}
    data[instance.keyName] = instance.isArray ? index : fragment.key
    data[instance.valName] = fragment.val
    if (instance.asName) {
        data[instance.asName] = instance.value
    }
    var vm = fragment.vm = platform.itemFactory(instance.vm, {
        data: data
    })
    if (instance.isArray) {
        vm.$watch(instance.valName, function(a) {
            if (instance.value && instance.value.set) {
                instance.value.set(vm[instance.keyName], a)
            }
        })
    } else {
        vm.$watch(instance.valName, function(a) {
            instance.value[fragment.key] = a
        })
    }
    fragment.index = index
    fragment.innerRender = avalon.scan(instance.fragment, vm, function() {
        var oldRoot = this.root
        ap.push.apply(fragment.children, oldRoot.children)
        this.root = fragment
    })
    return fragment
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