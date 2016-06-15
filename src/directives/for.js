var patch = require('../strategy/patch')
var rforPrefix = /ms-for\:\s*/
var rforLeft = /^\s*\(\s*/
var rforRight = /\s*\)\s*$/
var rforSplit = /\s*,\s*/
var rforAs = /\s+as\s+([$\w]+)/
var rident = require('../seed/regexp').ident
var update = require('./_update')
var Cache = require('../seed/cache')
var forCache = new Cache(128)
var rinvalid = /^(null|undefined|NaN|window|this|\$index|\$id)$/
function getTraceKey(item) {
    var type = typeof item
    return item && type === 'object' ? item.$hashcode : type + ':' + item
}
//IE6-8,function后面没有空格
var rfunction = /^\s*function\s*\(([^\)]+)\)/
avalon._each = function (obj, fn, local) {
    var str = (fn + "").match(rfunction)
    var args = str[1]
    var arr = args.match(avalon.rword)
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


//将要循环的节点根据锚点元素再分成一个个更大的单元,用于diff
function prepareCompare(nodes, cur) {
    var splitText = cur.signature
    var items = []
    var keys = []
    var com = {
        children: []
    }
    for (var i = 0, el; el = nodes[i]; i++) {
        if (el.nodeType === 8 && el.nodeValue === splitText) {
            com.children.push(el)
            com.key = el.key
            keys.push(el.key)
            com.index = items.length
            items.push(com)
            com = {
                children: []
            }
        } else {
            com.children.push(el)
        }
    }
    cur.components = items
    cur.compareText = keys.length + '|' + keys.join(';;')
}

function getDOMs(first, last, signature) {
    var items = []
    var all = []
    var item = []
    for (var el = first; el && el !== last; el = el.nextSibling) {
        all.push(el)
        if (el.nodeType === 8 && el.nodeValue === signature) {
            item.push(el)
            items.push(item)
            item = []
        } else {
            item.push(el)
        }
    }
    items.all = all
    return items
}

avalon.directive('for', {
    priority: 3,
    parse: function (cur, pre, binding) {
        var str = pre.nodeValue, aliasAs
        str = str.replace(rforAs, function (a, b) {
            if (!rident.test(b) || rinvalid.test(b)) {
                avalon.error('alias ' + b + ' is invalid --- must be a valid JS identifier which is not a reserved name.')
            } else {
                aliasAs = b
            }
            return ''
        })
        
        var arr = str.replace(rforPrefix, '').split(' in ')
        var assign = 'var loop = ' + avalon.parseExpr(arr[1]) + ' \n'
        var assign2 = 'var ' + pre.signature + ' = vnodes[vnodes.length-1]\n'
        var alias = aliasAs ? 'var ' + aliasAs + ' = loop\n' : ''
        var kv = arr[0].replace(rforLeft, '').replace(rforRight, '').split(rforSplit)

        if (kv.length === 1) {//确保avalon._each的回调有三个参数
            kv.unshift('$key')
        }
        kv.push('traceKey')
        kv.push('__local__')
        //分别创建isArray, ____n, ___i, ___v, ___trackKey变量
        //https://www.w3.org/TR/css3-animations/#animationiteration
        pre.$append = assign + assign2 + alias + 'avalon._each(loop,function('
                + kv.join(', ') + '){\n'
                + (aliasAs ? '__local__[' + avalon.quote(aliasAs) + ']=loop\n' : '')

    },
    diff: function (current, previous, steps, __index__) {
        var cur = current[__index__]
        var pre = previous[__index__] || {}
        
        //2.0.7不需要cur.start
        var nodes = current.slice(__index__, cur.end)
        cur.items = nodes.slice(1, -1)

        prepareCompare(cur.items, cur)
        delete pre.forDiff
      
        if (cur.compareText === pre.compareText) {
            avalon.shadowCopy(cur, pre)
            return
        }
        
        cur.forDiff = true        
        var i, c, p
        if (!('items' in pre)) {
            cur.action = 'init'
            var _items = getRepeatRange(previous, __index__)
            pre.items = _items.slice(1, -1)
            pre.components = []
            pre.repeatCount = pre.items.length
        }

        cur.endRepeat = pre.endRepeat
        if(!pre.repeatCount){
            pre.repeatCount = pre.items.length
        }
        var n = Math.max(nodes.length - 2, 0) - pre.repeatCount

        //让循环区域在新旧vtree里对齐
        if (n > 0) {
            var spliceArgs = [__index__ + 1, 0]
            for (var i = 0; i < n; i++) {
                spliceArgs.push(null)
            }
            previous.splice.apply(previous, spliceArgs)
        } else if (n < 0) {
            previous.splice.apply(previous, [__index__, Math.abs(n)])
        }
        if ( cur.action === 'init') {
            /* eslint-disable no-cond-assign */
            var cache = cur.cache = {}
            for (i = 0; c = cur.components[i]; i++) {
                /* eslint-enable no-cond-assign */
                saveInCache(cache, c)
                c.action = 'enter'
                if (cur.fixAction) {
                    c.action = 'move'
                    c.domIndex = i
                }
            }
            cur.removedComponents = {}
            //如果没有孩子也要处理一下
        } else {
            var cache = pre.cache
            if (!cache)
                return
            var newCache = {}
            /* eslint-disable no-cond-assign */
            var fuzzy = []
            for (i = 0; c = cur.components[i++]; ) {
                var p = isInCache(cache, c.key)
                if (p) {
                    c.action = 'move'
                    clearDom(p.children)
                    c.domIndex = p.index

                } else {
                    fuzzy.push(c)
                }
                saveInCache(newCache, c)
            }
            for (var i = 0, c; c = fuzzy[i++]; ) {
                p = fuzzyMatchCache(cache, c.key)
                if (p) {
                    c.action = 'move'
                    clearDom(p.children)
                    c.domIndex = p.index
                } else {
                    c.action = 'enter'
                }
            }
            /* eslint-enable no-cond-assign */
            cur.cache = newCache
            var dels = []
            for (var i in cache) {
                var c = cache[i]
                dels.push(c)
                if (c.arr)
                    [].push.apply(dels, c.arr)
            }
            cur.removedComponents = dels
        }
        pre.components.length = 0 //release memory

        cur.prevItems = pre.items
        cur.steps = steps

        delete pre.cache
        delete pre.items
        update(cur, this.update, steps, 'for')
        return __index__ + nodes.length - 1

    },
    update: function (startRepeat, vnode, parent) {
        var endRepeat = vnode.endRepeat
        var key = vnode.signature
        var DOMs = getDOMs(startRepeat.nextSibling, endRepeat, key)
        if (DOMs.length === 0 ||   vnode.action == 'init' ) {
            DOMs.all.forEach(function (el) {
                parent.removeChild(el)
            })
        }

        var fragment = avalon.avalonFragment

        var domTemplate
        var hasDeleted = {}
        for (var i = 0, el; el = vnode.removedComponents[i++]; ) {
            hasDeleted[el.index] = true
            var removeNodes = DOMs[el.index]
            if (removeNodes) {
                removeNodes.forEach(function (n, k) {
                    if (n.parentNode) {
                        avalon.applyEffect(n, el.children[k], {
                            hook: 'onLeaveDone',
                            cb: function () {
                                n.parentNode.removeChild(n)
                            },
                            staggerKey: key + 'leave'
                        })
                    }
                })
                el.children.length = 0
            }
        }

        delete vnode.removedComponents

        var insertPoint = startRepeat
        var entity = []
        for (var i = 0; i < vnode.components.length; i++) {
            var com = vnode.components[i]
            //添加nodes属性并插入节点
            if (com.action === 'enter') {
                if (!domTemplate) {
                    domTemplate = avalon.parseHTML(vnode.template)
                }
                var newFragment = domTemplate.cloneNode(true)
                newFragment.appendChild(document.createComment(vnode.signature))
                var cnodes = avalon.slice(newFragment.childNodes)

                parent.insertBefore(newFragment, insertPoint.nextSibling)
                applyEffects(cnodes, com.children, {
                    hook: 'onEnterDone',
                    staggerKey: key + 'enter'
                })
            } else if (com.action === 'move') {
                if (hasDeleted[com.index]) {
                    continue
                }
                var moveFragment = fragment.cloneNode(false)
                var cnodes = DOMs[com.domIndex] || []
                for (var k = 0, cc; cc = cnodes[k++]; ) {
                    moveFragment.appendChild(cc)
                }
                parent.insertBefore(moveFragment, insertPoint.nextSibling)
                applyEffects(cnodes, com.children, {
                    hook: 'onMoveDone',
                    staggerKey: key + 'move'
                })
            }
            entity.push.apply(entity, cnodes)
            insertPoint = cnodes[cnodes.length - 1]
            if (!insertPoint) {
                break
            }
        }
       
        var items = vnode.items|| []
       
        var steps = vnode.steps
        var oldCount = steps.count
        vnode.repeatCount = items.length
        avalon.diff(items, vnode.prevItems, steps)

        if (steps.count !== oldCount) {
            patch(entity, items, parent, steps)
        }

        var cb = avalon.caches[vnode.cid]
        if (cb) {
            cb.call(vnode.vmodel, {
                type: 'rendered',
                target: startRepeat,
                endRepeat: endRepeat,
                signature: vnode.signature
            })
        }
        return false
    }

})

function getRepeatRange(nodes, i) {
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
function clearDom(arr) {
    for (var i = 0, el; el = arr[i++]; ) {
        if (el.dom) {
            el.dom = null
        }
        if (el.children) {
            clearDom(el.children)
        }
    }
}

var rfuzzy = /^(string|number|boolean)/
var rkfuzzy = /^_*(string|number|boolean)/
function fuzzyMatchCache(cache, id) {
    var m = id.match(rfuzzy)
    if (m) {
        var fid = m[1]
        for (var i in cache) {
            var n = i.match(rkfuzzy)
            if (n && n[1] === fid) {
                return isInCache(cache, i)
            }
        }
    }
}

// 新位置: 旧位置
function isInCache(cache, id) {
    var c = cache[id]
    if (c) {
        var arr = c.arr
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
    vnodes.forEach(function (el, i) {
        avalon.applyEffect(nodes[i], vnodes[i], opts)
    })
}
