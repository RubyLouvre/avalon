var patch = require('../strategy/patch2')
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
avalon._each = function (obj, fn, local, vnodes) {
    var repeat = []
    vnodes.push(repeat)
    var str = (fn + "").match(rfunction)
    var args = str[1]
    var arr = args.match(avalon.rword)
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
        var alias = aliasAs ? 'var ' + aliasAs + ' = loop\n' : ''
        //  var d = cur.signature.split('+')[0]
        //  var aa = 'var ' + d +'='+avalon.quote(d)+'\n' 
        var kv = arr[0].replace(rforLeft, '').replace(rforRight, '').split(rforSplit)

        if (kv.length === 1) {//确保avalon._each的回调有三个参数
            kv.unshift('$key')
        }
        kv.push('traceKey')
        kv.push('__local__')
        kv.push('vnodes')
        //分别创建isArray, ____n, ___i, ___v, ___trackKey变量
        //https://www.w3.org/TR/css3-animations/#animationiteration
        pre.$append = assign + alias + 'avalon._each(loop,function('
                + kv.join(', ') + '){\n'
                + (aliasAs ? '__local__[' + avalon.quote(aliasAs) + ']=loop\n' : '')

    },
    diff: function (cur, pre, steps, curRepeat, preRepeat) {
        //将curRepeat转换成一个个可以比较的component,并求得compareText
        preRepeat = preRepeat || []
        //preRepeat不为空时

        prepareCompare(curRepeat, cur)
        delete pre.forDiff
        //如果个数与key一致,那么说明此数组没有发生排序,立即返回
        if (cur.compareText === pre.compareText) {
            avalon.shadowCopy(cur, pre)
            return
        }

        cur.items = curRepeat
        cur.forDiff = true
        curRepeat.prevItems = preRepeat
        curRepeat.forDiff = true
//        var n = preRepeat.length
//        if (n === 0) {
//            curRepeat.needRemoveCount = 0
//        } else {
//            if (curRepeat[n - 1].signature !== cur.signature) {
//                curRepeat.needRemoveCount = n
//            } else {
//                curRepeat.needRemoveCount = 0
//            }
//        }


        var i, c, p
        var cache = pre.cache
        if (!cache) {
            cur.action = 'init'
            prepareCompare(preRepeat, pre)
        } else {
            cur.action = 'update'
        }

        if (!cache) {
            /* eslint-disable no-cond-assign */
            var cache = cur.cache = {}
            for (i = 0; c = cur.components[i]; i++) {
                /* eslint-enable no-cond-assign */
                saveInCache(cache, c)
                c.action = 'enter'
//                if (cur.fixAction) {
//                    c.action = 'move'
//                    c.domIndex = i
//                }
            }
            cur.removedComponents = {}
            //如果没有孩子也要处理一下
        } else {
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

        pre.cache = pre.action = pre.components =
                pre.compareText = pre.items = 0
        update(cur, this.update, steps, 'for')
        return true

    },
    update: function (startRepeat, vnode, parent) {
        console.log('进入for diff')
        var arr = getEndRepeat(startRepeat)

        var doms = arr.slice(1, -1)
        var endRepeat = arr.pop()
        var items = vnode.items
        items.endRepeat = endRepeat
        var prevItems = items.prevItems
        var DOMs = splitDOMs(doms)
        var key = vnode.signature
        var check = doms[doms.length - 1]
        if (check.nodeValue !== key) {
            do {//去掉最初位于循环节点中的内容
                var prev = endRepeat.previousSibling
                if (prev === startRepeat || prev.nodeValue === key) {
                    break
                }
                if (prev) {
                    parent.removeChild(prev)
                    prevItems.pop()
                } else {
                    break
                }
            } while (true);
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

        items.entity = entity
        console.log(entity)
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

function splitDOMs(nodes, signature) {
    var items = []
    var item = []
    for (var i = 0, el; el = nodes[i++]; ) {
        if (el.nodeType === 8 && el.nodeValue === signature) {
            item.push(el)
            items.push(item)
            item = []
        } else {
            item.push(el)
        }
    }
    return items
}

function getEndRepeat(node) {
    var isBreak = 0, ret = []
    while (node) {
        if (node.nodeType === 8) {
            if (node.nodeValue.indexOf('ms-for:') === 0) {
                ++isBreak
            } else if (node.nodeValue.indexOf('ms-for-end:') === 0) {
                --isBreak
            }
        }
        ret.push(node)
        node = node.nextSibling
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
