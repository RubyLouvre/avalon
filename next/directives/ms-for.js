import { avalon, quote } from '../seed/lang.share'
import { serializeChildren } from '../strategy/serializeChildren'

import update from './_update'


var rargs = /[$\w_]+/g

function getTraceKey(item) {
    var type = typeof item
    return item && type === 'object' ? item.$hashcode : type + ':' + item
}

avalon._each = function (obj, fn, local) {

    var arr = (fn + '').slice(0, 40).match(rargs)
    arr.shift()
    if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            iterator(i, obj[i], local, fn, arr[0], arr[1], true)
        }
    } else {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                iterator(i, obj[i], local, fn, arr[0], arr[1])
            }
        }
    }
}

function iterator(index, item, vars, fn, k1, k2, isArray) {
    var key = isArray ? getTraceKey(item) : index
    var local = {}
    local[k1] = index
    local[k2] = item
    for (var k in vars) {
        if (!(k in local)) {
            local[k] = vars[k]
        }
    }
    fn(index, item, key, local)
}


avalon.directive('for', {
    priority: 3,
    parse: function (copy, src, binding) {
        var getLoop = avalon.parseExpr(binding)
        /**
         *  var vnodes = []
         *  avalon._each(loop, function(index, item, trackKey, __local__){
         *      __local__.valueOf = loop
         *      vnodes.push({
         *         nodeName: '#document-fragment',
         *         key: traceKey,
         *         children: new function(){
         *             var vnodes = []
         *             serializeChildren(copy['ms-for][0].children)
         *             vnodes.push({
         *                 nodeName: '#comment',
         *                 nodeValue: quote(src.signature)
         *             })
         *             return vnodes
         *         }
         *      })
         *  },__local__|| {})
         *  return vnodes
         */
        var d = src.dynamic
        delete copy.action
        copy.dynamic = '{}'
        copy['ms-for'] = getLoop
        copy.vmodel = '__vmodel__'
        copy.local = '__local__'
        var renderBody = [
            '  var vnodes = [];',
            '  avalon._each(loop, function(' + d.args + '){',
            '  __local__[' + quote(d.aliasAs || 'valueOf') + '] = loop',
            '  vnodes.push({',
            '     nodeName: "#document-fragment",',
            '     key     : traceKey,',
            '     index   : arguments[0],',
            '     children: new function(){',
            '        var vnodes = ' + avalon.caches[src.signature],
            '        vnodes.push({',
            '           nodeName: "#comment",',
            '           nodeValue:' + quote(src.signature),
            '        })',
            '        return vnodes',
            '    }',
            '  })',
            '  return vnodes;',
            '  },__local__|| {})',
            'return vnodes'
        ].join('\n')
        copy.render = src.render = new Function('__vmodel__', ' __local__', 'loop', renderBody)
    },
    diff: function (copy, src, name) {
        //将curRepeat转换成一个个可以比较的component,并求得compareText
        //如果这个元素没有插入

        var srcRepeat = src[name]
        var curRepeat = src.render(copy.vmodel, copy.local, copy[name])
        var end = src.end
        //preRepeat不为空时
        var cache = src.cache || {}
        //for指令只做添加删除操作
        var i, c, p
        var removes = []
        if (!src.list || !src.list.length) {//一维数组最开始初始化时
            src.action = 'init'
            /* eslint-disable no-cond-assign */
            src[name] = curRepeat
            curRepeat.forEach(function (c, i) {
                srcRepeat[i] = c
                saveInCache(cache, c)
            })
            src.cache = cache
          
        } else if (srcRepeat === curRepeat) {
            curRepeat.forEach(function (c) {
                c.action = 'move'
                saveInCache(cache, c)
            })
            src.cache = cache

        } else {
            src.action = 'update'
            var newCache = {}
            /* eslint-disable no-cond-assign */
            var fuzzy = []
            for (i = 0; c = curRepeat[i]; i++) {
                var p = isInCache(cache, c.key)
                if (p) {
                    p.oldIndex = p.index
                    p.index = c.index
                    saveInCache(newCache, p)
                } else {
                    //如果找不到就进行模糊搜索
                    fuzzy.push(c)
                }
            }
            for (var i = 0, c; c = fuzzy[i]; i++) {
                p = fuzzyMatchCache(cache, c.key)
                if (p) {
                    p.oldIndex = p.index
                    p.index = c.index
                    p.key = c.key
                } else {
                    p = c
                    srcRepeat.push(p)
                }

                saveInCache(newCache, p)
            }
            srcRepeat.sort(function (a, b) {
                return a.index - b.index
            })

            src.cache = newCache
            for (var i in cache) {
                p = cache[i]
                p.action = 'leave'
                avalon.Array.remove(srcRepeat, p)
                removes.push(p)
                if (p.arr) {
                    p.arr.forEach(function (m) {
                        m.action = 'leave'
                        removes.push(m)
                    })
                    delete p.arr
                }
            }
           
        }
          src.list = srcRepeat
        /* istanbul ignore if */
        if (removes.length > 1) {
            removes.sort(function (a, b) {
                return a.index - b.index
            })
        }
        src.removes = removes
        var cb = avalon.caches[src.wid]
        var vm = copy.vmodel
        if (end && cb) {
            end.afterChange = [function (dom) {
                cb.call(vm, {
                    type: 'rendered',
                    target: dom,
                    signature: src.signature
                })
            }]
        }

        update(src, this.update)
    },
    update: function (dom, vdom, parent) {
        if (vdom.action === 'init') {
            var b = parent
            parent = document.createDocumentFragment()
        }
       
        var before = dom
        var signature = vdom.signature
        var hasEffect = vdom.dynamic.hasEffect
        for (var i = 0, item; item = vdom.removes[i++];) {
            if (item.dom) {

                delete item.split
                /* istanbul ignore if*/
                /* istanbul ignore else*/
                if (hasEffect) {
                    !function (obj) {
                        var nodes = moveItem(obj)
                        var children = obj.children.concat()
                        obj.children.length = 0
                        applyEffects(nodes, children, {
                            hook: 'onLeaveDone',
                            staggerKey: signature + 'leave',
                            cb: function (node) {
                                if (node.parentNode) {
                                    node.parentNode.removeChild(node)
                                }
                            }
                        })
                    } (item)
                } else {
                    moveItem(item, 'add')
                }

            }
        }

        vdom.list.forEach(function (el, i) {
            if (el.action === 'leave')
                return
            if (!el.dom) {
                el.dom = avalon.domize(el)
            }
            var f = el.dom
            if (el.oldIndex === void 0) {
                if (hasEffect)
                    var nodes = avalon.slice(f.childNodes)
                if (i === 0 && vdom.action === 'init') {
                    parent.appendChild(f)
                } else {
                    parent.insertBefore(f, before.nextSibling)
                }
                if (hasEffect) {
                    applyEffects(nodes, el.children, {
                        hook: 'onEnterDone',
                        staggerKey: signature + 'enter'
                    })
                }
            } else if (el.index !== el.oldIndex) {
                var nodes = moveItem(el, 'add')
                parent.insertBefore(el.dom, before.nextSibling)
                hasEffect && applyEffects(nodes, el.children, {
                    hook: 'onMoveDone',
                    staggerKey: signature + 'move'
                })
            }

            before = el.split
        })
        if (vdom.action === 'init') {
            b.insertBefore(parent, dom.nextSibling)
        }
    }

})

function moveItem(item, addToFragment) {
    var nodes = item.children.map(function (el) {
        return el['ms-if'] ? el.comment : el.dom
    })
    if (addToFragment) {
        nodes.forEach(function (el) {
            item.dom.appendChild(el)
        })
    }
    return nodes
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

var applyEffects = function (nodes, vnodes, opts) {
    vnodes.forEach(function (vdom, i) {
        avalon.applyEffect(nodes[i], vdom, opts)
    })
}
