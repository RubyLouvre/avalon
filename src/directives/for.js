var update = require('./_update')

var rforAs = /\s+as\s+([$\w]+)/
var rident = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/
var rinvalid = /^(null|undefined|NaN|window|this|\$index|\$id)$/
var rargs = /[$\w]+/g

function getTraceKey(item) {
    var type = typeof item
    return item && type === 'object' ? item.$hashcode : type + ':' + item
}

avalon._each = function (obj, fn, local, vnodes) {
    var repeat = []
    vnodes.push(repeat)
    var arr = (fn + '').slice(0, 40).match(rargs)

    arr.shift()

    if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            iterator(i, obj[i], local, fn, arr[0], arr[1], repeat, true)
        }
    } else {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                iterator(i, obj[i], local, fn, arr[0], arr[1], repeat)
            }
        }
    }
}

function iterator(index, item, vars, fn, k1, k2, repeat, isArray) {
    var key = isArray ? getTraceKey(item) : index
    var local = {}
    local[k1] = index
    local[k2] = item
    for (var k in vars) {
        if (!(k in local)) {
            local[k] = vars[k]
        }
    }
    fn(index, item, key, local, repeat)
}


avalon.directive('for', {
    priority: 3,
    parse: function (copy, src) {
        var str = src.forExpr, aliasAs
        str = str.replace(rforAs, function (a, b) {
            /* istanbul ignore if */
            if (!rident.test(b) || rinvalid.test(b)) {
                avalon.error('alias ' + b + ' is invalid --- must be a valid JS identifier which is not a reserved name.')
            } else {
                aliasAs = b
            }
            return ''
        })

        var arr = str.split(' in ')
        var binding = {
            expr: arr[1].trim(),
            type: 'for'
        }
        var getLoop = avalon.parseExpr(binding)
        var kv = (arr[0]+' traceKey __local__ vnodes').match(rargs)
        if (kv.length === 4) {//确保avalon._each的回调有三个参数
            kv.unshift('$key')
        }
        src.$append = Array('var loop = ' + getLoop + ';',
                'avalon._each(loop, function(' + kv + '){',
                '__local__[' + avalon.quote(aliasAs || 'valueOf') + '] = loop',
                'vnodes.push({',
                '\tnodeName: "#document-fragment",',
                '\tindex   : arguments[0],',
                '\tkey     : traceKey,',
                '\tchildren: new function(){\nvar vnodes = []\n').join('\n')

    },
    diff: function (copy, src, cpList, spList, index) {
        //将curRepeat转换成一个个可以比较的component,并求得compareText
        //如果这个元素没有插入
        if (avalon.callArray) {
            if (src.list && src.forExpr.indexOf(avalon.callArray) === -1) {
                return 
            }
        } 

        var srcRepeat = spList[index + 1]
        var curRepeat = cpList[index + 1]
        var end = cpList[index + 2]
        //preRepeat不为空时
        var cache = src.cache || {}
        //for指令只做添加删除操作
        var i, c, p
        var removes = []
        if (!srcRepeat.length) {//一维数组最开始初始化时
            src.action = 'init'

            /* eslint-disable no-cond-assign */
            spList[index + 1] = curRepeat
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
            var noUpdate = true
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
        if (!noUpdate) {
            src.list = srcRepeat
            update(src, this.update)
        }
        return true

    },
    update: function (dom, vdom, parent) {
        if (vdom.action === 'init') {
            var b = parent
            parent = document.createDocumentFragment()
        }
        var before = dom
        var signature = vdom.signature

        for (var i = 0, item; item = vdom.removes[i++]; ) {
            if (item.dom) {

                delete item.split
                /* istanbul ignore if*/
                /* istanbul ignore else*/
                if (vdom.hasEffect) {
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
                    }(item)
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
                if (vdom.hasEffect)
                    var nodes = avalon.slice(f.childNodes)
                if (i === 0 && vdom.action === 'init') {
                    parent.appendChild(f)
                } else {
                    parent.insertBefore(f, before.nextSibling)
                }
                if (vdom.hasEffect) {
                    applyEffects(nodes, el.children, {
                        hook: 'onEnterDone',
                        staggerKey: signature + 'enter'
                    })
                }
            } else if (el.index !== el.oldIndex) {
                var nodes = moveItem(el, 'add')
                parent.insertBefore(el.dom, before.nextSibling)
                vdom.hasEffect && applyEffects(nodes, el.children, {
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


avalon.domize = function (a) {
    return avalon.vdom(a, 'toDOM')
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
