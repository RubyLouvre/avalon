var patch = require('../strategy/patch')
var rforPrefix = /ms-for\:\s*/
var rforLeft = /^\s*\(\s*/
var rforRight = /\s*\)\s*$/
var rforSplit = /\s*,\s*/
var rforAs = /\s+as\s+([$\w]+)/
var rident = require('../seed/regexp').ident
var update = require('./_update')
var Cache = require('../seed/cache')
var loopCache = new Cache(600)
var rinvalid = /^(null|undefined|NaN|window|this|\$index|\$id)$/
function getTrackKey(item) {
    var type = typeof item
    return item && type === 'object' ? item.$hashcode : type + item
}

avalon._each = function (obj, fn) {
    if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            var item = obj[i]
            var key = getTrackKey(item)
            fn(i, item, key)
        }
    } else {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                fn(i, obj[i], i)
            }
        }
    }
}

function getEnumText(enume) {
    if (Array.isArray(enume)) {
        return enume.length + '|' + enume.map(getTrackKey).join(';;')
    } else {
        var size = 0
        var arr = []
        for (var i in enume) {
            if (enume.hasOwnProperty(i)) {
                size++
                arr.push(i+'*'+enume[i])
            }
        }
        return size + '|' + arr.join(';;')
    }
}

function getCompareText(vnode){
    var text = getEnumText(vnode.enume)
    vnode.compareText = text
}



avalon.directive('for', {
    priority: 3,
    parse: function (el, num) {
        var str = el.nodeValue, aliasAs
        str = str.replace(rforAs, function (a, b) {
            if (!rident.test(b) || rinvalid.test(b)) {
                avalon.error('alias ' + b + ' is invalid --- must be a valid JS identifier which is not a reserved name.')
            } else {
                aliasAs = b
            }
            return ''
        })
        var arr = str.replace(rforPrefix, '').split(' in ')
        var assign = 'var loop' + num + ' = ' + avalon.parseExpr(arr[1]) + '\n'
        var enume = el.signature+'.enume = loop' + num + '\n';
        var alias = aliasAs ? 'var ' + aliasAs + ' = loop' + num + '\n' : ''
        var kv = arr[0].replace(rforLeft, '').replace(rforRight, '').split(rforSplit)
        if (kv.length === 1) {//确保avalon._each的回调有三个参数
            kv.unshift('$key')
        }
        //分别创建isArray, ____n, ___i, ___v, ___trackKey变量
        return assign + enume + alias + 'avalon._each(loop' + num + ', function(' + kv + ', traceKey){\n'

    },
    diff: function (current, previous, steps, __index__) {
        var cur = current[__index__]
        var pre = previous[__index__] || {}
        getCompareText(cur)
        if(cur.compareText === pre.compareText){
            return 
        }
        cur.forDiff = true
        
        var isInit = !('directive' in pre)
        var isChange = false, i, c, p
        if (isInit) {
            pre.components = []
            pre.repeatCount = 0
        }

        var quota = pre.components.length
        var nodes = current.slice(cur.start, cur.end)
        cur.endRepeat = pre.endRepeat
        cur.components = getComponents(nodes.slice(1, -1), cur.signature)
        var n = Math.max(nodes.length - 2, 0) - pre.repeatCount
        if (n > 0) {
            var spliceArgs = [__index__ + 1, 0]
            for (var i = 0, n = n - 1; i < n; i++) {
                spliceArgs.push(null)
            }
            previous.splice.apply(previous, spliceArgs)
        } else if (n < 0) {
            previous.splice.apply(previous, [__index__, Math.abs(n)])
        }
        cur.action = isInit ? 'init' : 'update'
        if (isInit) {
            /* eslint-disable no-cond-assign */
            var oldCount = steps.count
            var cache = cur.cache = {}
            for (i = 0; c = cur.components[i++]; ) {
                /* eslint-enable no-cond-assign */
                avalon.diff(c.children, [], steps)
                saveInCache(cache, c)
            }
            cur.removedComponents = {}
            //如果没有孩子也要处理一下
            isChange = cur.components.length === 0 ||
                    steps.count !== oldCount

        } else {
            var cache = pre.cache 
            if(!cache)
                return
            var newCache = cur.cache = {}
            /* eslint-disable no-cond-assign */
            for (i = 0; c = cur.components[i++]; ) {
                /* eslint-enable no-cond-assign */
                var p = isInCache(cache, c.key)
                if (p) {
                    if (!isChange) {//如果位置发生了变化
                        isChange = c.index !== p.index
                    }
                    quota--
                    c.nodes = p.nodes
                    avalon.diff(c.children, p.children, steps)
                } else if (quota) {
                    p = fuzzyMatchCache(cache, c.key)
                    if (p) {
                        quota--
                        isChange = true //内容发生变化
                        c.nodes = p.nodes
                        avalon.diff(c.children, p.children, steps)
                    }
                }
                if (!c.nodes) {//这是新添加的元素
                    isChange = true
                    avalon.diff(c.children, [], steps)
                }

                saveInCache(newCache, c)
            }

            for (i in cache) {
                cur.removedComponents = cache
                isChange = true
                break
            }

        }
        pre.components.length = 0 //release memory
        delete pre.cache
        if (isChange) {
            cur.steps = steps
            update(cur, this.update, steps, 'for')
        }

        return __index__ + nodes.length - 1

    },
    update: function (startRepeat, vnode, parent) {
        var action = vnode.action
        var endRepeat = vnode.endRepeat
        var fragment = document.createDocumentFragment()
        if (action === 'init') {
            //在ms-widget中,这部分内容会先行被渲染出来
            var hasRender = false
            var node = startRepeat.nextSibling
            while (node && node !== endRepeat) {
                if (node.nodeType === 8) {
                    hasRender = node.nodeValue === vnode.signature
                    if (hasRender) {
                        vnode.hasRender = true
                        break
                    }
                }
                node = node.nextSibling

            }
            if (!hasRender) {
                node = startRepeat.nextSibling
                while (node && node !== endRepeat) {
                    parent.removeChild(node)
                    node = startRepeat.nextSibling
                }
            }
        }

        var domTemplate = avalon.parseHTML(vnode.template)

        var key = vnode.signature
        for (var i in vnode.removedComponents) {
            var el = vnode.removedComponents[i]
            if (el.nodes) {
                el.nodes.forEach(function (n, k) {
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
                el.nodes.length = el.children.length = 0
            }
        }

        delete vnode.removedComponents

        var insertPoint = startRepeat

        for (var i = 0; i < vnode.components.length; i++) {
            var com = vnode.components[i]
            var cnodes = com.nodes
            if (cnodes) {
                if (insertPoint.nextSibling !== cnodes[0]) {
                    var moveFragment = fragment.cloneNode(false)
                    for (var k = 0, cc; cc = cnodes[k++]; ) {
                        moveFragment.appendChild(cc)
                    }
                    parent.insertBefore(moveFragment, insertPoint.nextSibling)
                    applyEffects(com.nodes, com.children, {
                        hook: 'onMoveDone',
                        staggerKey: key + 'move'
                    })
                }
            } else if (vnode.hasRender) {
                //添加nodes属性但不用插入节点
                var cnodes = com.nodes = []
                insertPoint = insertPoint.nextSibling
                while (insertPoint && insertPoint !== vnode.endRepeat) {
                    cnodes.push(insertPoint)
                    if (insertPoint.nodeValue === vnode.signature) {
                        break
                    }
                    insertPoint = insertPoint.nextSibling
                }
            } else {
                //添加nodes属性并插入节点
                var newFragment = domTemplate.cloneNode(true)
                newFragment.appendChild(document.createComment(vnode.signature))
                cnodes = com.nodes = avalon.slice(newFragment.childNodes)
                parent.insertBefore(newFragment, insertPoint.nextSibling)
                applyEffects(com.nodes, com.children, {
                    hook: 'onEnterDone',
                    staggerKey: key + 'enter'
                })
            }
            insertPoint = cnodes[cnodes.length - 1]
            if (!insertPoint) {
                break
            }
        }
        var entity = [], vnodes = []
        vnode.components.forEach(function (c) {
            entity.push.apply(entity, c.nodes)
            vnodes.push.apply(vnodes, c.children)
        })
        vnode.repeatCount = vnodes.length
        patch(entity, vnodes, parent, vnode.steps)
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


//将要循环的节点根据锚点元素再分成一个个更大的单元,用于diff
function getComponents(nodes, signature) {
    var components = []
    var com = {
        children: []
    }
    for (var i = 0, el; el = nodes[i]; i++) {
        if (el.nodeType === 8 && el.nodeValue === signature) {
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
    var c = cache[id], cid = id
    if (c) {
        var ctack = cache["***" + id]
        if (ctack) {
            var a = ctack.pop()
            delete cache[a.id]
            if (ctack.length == 0)
                delete cache["***" + id]
            return a.c
        }
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
        if (stack.length) {
            cache['***' + cid] = stack
        }
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
var applyEffects = function (nodes, vnodes, opts) {
    vnodes.forEach(function (el, i) {
        avalon.applyEffect(nodes[i], vnodes[i], opts)
    })
}

