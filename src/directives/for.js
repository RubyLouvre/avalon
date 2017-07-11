import { avalon, createFragment, platform, isObject, ap } from '../seed/core'

import { VFragment } from '../vdom/VFragment'
import { $$skipArray } from '../vmodel/reserved'

import { addScope, makeHandle } from '../parser/index'
import { updateView } from './duplex/share'


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
            kv.unshift('$key')
        }
        this.expr = arr[1]
        this.keyName = kv[0]
        this.valName = kv[1]
        this.signature = avalon.makeHashCode('for')
        if (asName) {
            this.asName = asName
        }

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
    diff: function(newVal, oldVal) {
        /* istanbul ignore if */
        if (this.updating) {
            return
        }
        this.updating = true
        var traceIds = createFragments(this, newVal)

        if (this.oldTrackIds === void 0)
            return true

        if (this.oldTrackIds !== traceIds) {
            this.oldTrackIds = traceIds
            return true
        }

    },
    update: function() {

        if (!this.preFragments) {
            this.fragments = this.fragments || []
            mountList(this)
        } else {
            diffList(this)
            updateList(this)
        }

        if (this.userCb) {
            var me = this
                setTimeout(function(){
                    me.userCb.call(me.vm, {
                    type: 'rendered',
                    target: me.begin.dom,
                    signature: me.signature
                })
            },0)
            
        }
        delete this.updating
    },
    beforeDispose: function() {
        this.fragments.forEach(function(el) {
            el.dispose()
        })
    }
})

function getTraceKey(item) {
    var type = typeof item
    return item && type === 'object' ? item.$hashcode : type + ':' + item
}

//创建一组fragment的虚拟DOM
function createFragments(instance, obj) {
    if (isObject(obj)) {
        var array = Array.isArray(obj)
        var ids = []
        var fragments = [],
            i = 0

        instance.isArray = array
        if (instance.fragments) {
            instance.preFragments = instance.fragments
            avalon.each(obj, function(key, value) {
                var k = array ? getTraceKey(value) : key

                fragments.push({
                    key: k,
                    val: value,
                    index: i++
                })
                ids.push(k)
            })
            instance.fragments = fragments
        } else {
            avalon.each(obj, function(key, value) {
                if(!(key in $$skipArray)){
                    var k = array ? getTraceKey(value) : key
                    fragments.push(new VFragment([], k, value, i++))
                    ids.push(k)
                }
            })
            instance.fragments = fragments
        }
        return ids.join(';;')
    } else {
        return NaN
    }
}


function mountList(instance) {
    var args = instance.fragments.map(function(fragment, index) {
        FragmentDecorator(fragment, instance, index)
        saveInCache(instance.cache, fragment)
        return fragment
    })
    var list = instance.parentChildren
    var i = list.indexOf(instance.begin)
    list.splice.apply(list, [i + 1, 0].concat(args))
}

function diffList(instance) {
    var cache = instance.cache
    var newCache = {}
    var fuzzy = []
    var list = instance.preFragments

    list.forEach(function(el) {
        el._dispose = true
    })

    instance.fragments.forEach(function(c, index) {
        var fragment = isInCache(cache, c.key)
            //取出之前的文档碎片
        if (fragment) {
            delete fragment._dispose
            fragment.oldIndex = fragment.index
            fragment.index = index // 相当于 c.index

            resetVM(fragment.vm, instance.keyName)
            fragment.vm[instance.valName] = c.val
            fragment.vm[instance.keyName] = instance.isArray ? index : fragment.key
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

            fragment.vm[instance.valName] = val
            fragment.vm[instance.keyName] = instance.isArray ? index : fragment.key
            delete fragment._dispose
        } else {

            c = new VFragment([], c.key, c.val, c.index)
            fragment = FragmentDecorator(c, instance, c.index)
            list.push(fragment)
        }
        saveInCache(newCache, fragment)
    })

    instance.fragments = list
    list.sort(function(a, b) {
        return a.index - b.index
    })
    instance.cache = newCache
}

function updateItemVm(vm, top) {
    for (var i in top) {
        if (top.hasOwnProperty(i)) {
            vm[i] = top[i]
        }
    }
}

function resetVM(vm, a, b) {
    if(avalon.config.inProxyMode){
       vm.$accessors[a].value = NaN
    }else{
         vm.$accessors[a].set(NaN)
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
            var isEnd = before.nextSibling === null
            parent.insertBefore(f, before.nextSibling);
            if (isEnd && !parent.contains(end)) {
                parent.insertBefore(end, before.nextSibling)
            }
        }
        before = item.split
    }
    var ch = instance.parentChildren
    var startIndex = ch.indexOf(instance.begin)
    var endIndex = ch.indexOf(instance.end)

    list.splice.apply(ch, [startIndex + 1, endIndex - startIndex].concat(list))
    if(parent.nodeName ==='SELECT' && parent._ms_duplex_){
        updateView['select'].call(parent._ms_duplex_)
    }
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