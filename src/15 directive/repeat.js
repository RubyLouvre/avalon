bindingHandlers.repeat = function(data, vmodels) {
    var type = data.type
    parseExprProxy(data.value, vmodels, data, 0, 1)
    data.proxies = []
    var freturn = false
    try {
        var $repeat = data.$repeat = data.evaluator.apply(0, data.args || [])
        var xtype = avalon.type($repeat)
        if (xtype !== "object" && xtype !== "array") {
            freturn = true
            avalon.log("warning:" + data.value + "对应类型不正确")
        }
    } catch (e) {
        freturn = true
        avalon.log("warning:" + data.value + "编译出错")
    }

    var arr = data.value.split(".") || []
    if (arr.length > 1) {
        arr.pop()
        var n = arr[0]
        for (var i = 0, v; v = vmodels[i++]; ) {
            if (v && v.hasOwnProperty(n)) {
                var events = v[n].$events || {}
                events[subscribers] = events[subscribers] || []
                events[subscribers].push(data)
                break
            }
        }
    }
    var elem = data.element
    if (freturn) {
        return avalon(elem).addClass("avalonHide")
    }

    avalon(elem).removeClass("avalonHide")

    elem.removeAttribute(data.name)
    data.sortedCallback = getBindingCallback(elem, "data-with-sorted", vmodels)
    data.renderedCallback = getBindingCallback(elem, "data-" + type + "-rendered", vmodels)

    var comment = data.element = DOC.createComment("ms-"+type+"-end")
    data.clone = DOC.createComment("ms-"+type)
    hyperspace.appendChild(comment)

    if (type === "each" || type === "with") {
        data.template = elem.innerHTML.trim()
        avalon.clearHTML(elem).appendChild(comment)
    } else {
        data.template = elem.outerHTML.trim()
        elem.parentNode.replaceChild(comment, elem)
    }

    data.rollback = function() {
        var elem = data.element
        if (!elem)
            return
        bindingExecutors.repeat.call(data, "clear")
        var parentNode = elem.parentNode
        var content = avalon.parseHTML(data.template)
        var target = content.firstChild
        parentNode.replaceChild(content, elem)
        var start = data.$stamp
        start && start.parentNode && start.parentNode.removeChild(start)
        target = data.element = data.type === "repeat" ? target : parentNode
    }

    data.handler = bindingExecutors.repeat
    data.$outer = {}
    var check0 = "$key",
            check1 = "$val"
    if (Array.isArray($repeat)) {
        check0 = "$first"
        check1 = "$last"
    }
    for (var i = 0, p; p = vmodels[i++]; ) {
        if (p.hasOwnProperty(check0) && p.hasOwnProperty(check1)) {
            data.$outer = p
            break
        }
    }
    var $list = ($repeat.$events || {})[subscribers]
    if ($list && avalon.Array.ensure($list, data)) {
        addSubscribers(data, $list)
    }
    if (xtype === "object") {
        data.$with = true
        var $events = $repeat.$events
        var pool = !$events ? {} : $events.$withProxyPool || ($events.$withProxyPool = {})
        data.handler("append", $repeat, pool)
    } else if ($repeat.length) {
        data.handler("add", 0, $repeat)
    }
}

bindingExecutors.repeat = function(method, pos, el) {
    if (method) {
        var data = this
        var endRepeat = data.element
        var parent = endRepeat.parentNode
        var proxies = data.proxies
        var transation = hyperspace.cloneNode(false)
        switch (method) {
            case "add": //在pos位置后添加el数组（pos为数字，el为数组）
                var arr = el
                var last = data.$repeat.length - 1
                var fragments = []
                var locatedNode = locateFragment(data, pos)
                for (var i = 0, n = arr.length; i < n; i++) {
                    var ii = i + pos
                    var proxy = eachProxyAgent(ii, data)
                    proxies.splice(ii, 0, proxy)
                    shimController(data, transation, proxy, fragments)
                }
                parent.insertBefore(transation, locatedNode)
                for (var i = 0, fragment; fragment = fragments[i++]; ) {
                    scanNodeArray(fragment.nodes, fragment.vmodels)
                    fragment.nodes = fragment.vmodels = null
                }
                break
            case "del": //将pos后的el个元素删掉(pos, el都是数字)
                var transation = removeFragment(pos, el, proxies, endRepeat)
                var removed = proxies.splice(pos, el)
                avalon.clearHTML(transation)
                recycleProxies(removed, "each")
                break
            case "index": //将proxies中的第pos个起的所有元素重新索引（pos为数字，el用作循环变量）
                var last = proxies.length - 1
                for (; el = proxies[pos]; pos++) {
                    el.$index = pos
                    el.$first = pos === 0
                    el.$last = pos === last
                }
                break
            case "clear":
                var check = data.$stamp || proxies[0]
                if (check) {
                    var start = check.$stamp || check
                    while (true) {
                        var node = endRepeat.previousSibling
                        if (!node)
                            break
                        parent.removeChild(node)
                        if (node === start) {
                            break
                        }
                    }
                }
                recycleProxies(proxies, "each")
                break
            case "move": //将proxies中的第pos个元素移动el位置上(pos, el都是数字)
                locatedNode = locateFragment(data, el)
                transation = removeFragment(pos, 1, proxies, endRepeat)
                parent.insertBefore(transation, locatedNode)
                var t = proxies.splice(pos, 1)[0]
                proxies.splice(el, 0, t)
                break
            case "set": //将proxies中的第pos个元素的VM设置为el（pos为数字，el任意）
                var proxy = proxies[pos]
                if (proxy) {
                    notifySubscribers(proxy.$events.$index)
                }
                break
            case "append": //将pos的键值对从el中取出（pos为一个普通对象，el为预先生成好的代理VM对象池）
                var pool = el
                var keys = []
                var fragments = []
                for (var key in pos) { //得到所有键名
                    if (pos.hasOwnProperty(key) && key !== "hasOwnProperty") {
                        keys.push(key)
                    }
                }
                if (data.sortedCallback) { //如果有回调，则让它们排序
                    var keys2 = data.sortedCallback.call(parent, keys)
                    if (keys2 && Array.isArray(keys2) && keys2.length) {
                        keys = keys2
                    }
                }
                for (var i = 0, key; key = keys[i++]; ) {
                    if (key !== "hasOwnProperty") {
                        if (!pool[key]) {
                            pool[key] = withProxyAgent(key, data)
                        }
                        shimController(data, transation, pool[key], fragments)
                    }
                }
                var comment = data.$stamp = data.clone
                parent.insertBefore(comment, endRepeat)
                parent.insertBefore(transation,endRepeat)
                for (var i = 0, fragment; fragment = fragments[i++]; ) {
                    scanNodeArray(fragment.nodes, fragment.vmodels)
                    fragment.nodes = fragment.vmodels = null
                }
                break
        }
        if (method === "index")
            return
        if (method === "clear")
            method = "del"
        var callback = data.renderedCallback || noop,
                args = arguments
        checkScan(parent, function() {
            callback.apply(parent, args)
            if (parent.oldValue && parent.tagName === "SELECT") {//&& method === "index") { //fix #503
                avalon(parent).val(parent.oldValue.split(","))
            }
        }, NaN)
    }
}

"with,each".replace(rword, function(name) {
    bindingHandlers[name] = bindingHandlers.repeat
})

function shimController(data, transation, proxy, fragments) {
    var dom = avalon.parseHTML(data.template)
    var nodes = avalon.slice(dom.childNodes)
    if (proxy.$stamp) {
        dom.insertBefore(proxy.$stamp, dom.firstChild)
    }
    transation.appendChild(dom)
    var nv = [proxy].concat(data.vmodels)
    var fragment = {
        nodes: nodes,
        vmodels: nv
    }
    fragments.push(fragment)
}

function locateFragment(data, pos) {
    var proxy = data.proxies[pos]
    return proxy ? proxy.$stamp : data.element
}
function removeFragment(a, n, proxies, endRepeat) {
    var start = proxies[a].$stamp
    var proxy = proxies[a + n]
    var end = proxy ?  proxy.$stamp : endRepeat
    while (true) {
        var node = end.previousSibling
        if (!node)
            break
        hyperspace.insertBefore(node, hyperspace.firstChild)
        if (node === start) {
            break
        }
    }
    return hyperspace
}

// 为ms-each,ms-with, ms-repeat会创建一个代理VM，
// 通过它们保持一个下上文，让用户能调用$index,$first,$last,$remove,$key,$val,$outer等属性与方法
// 所有代理VM的产生,消费,收集,存放通过xxxProxyFactory,xxxProxyAgent, recycleProxies,xxxProxyPool实现
var eachProxyPool = []
var withProxyPool = []
function eachProxyFactory(name) {
    var source = {
        $host: [],
        $outer: {},
        $stamp: 1,
        $index: 0,
        $first: false,
        $last: false,
        $remove: avalon.noop
    }
    source[name] = {
        get: function() {
            return this.$host[this.$index]
        },
        set: function(val) {
            this.$host.set(this.$index, val)
        }
    }
    var second = {
        $last: 1,
        $first: 1,
        $index: 1
    }
    var proxy = modelFactory(source, second)
    var e = proxy.$events
    e[name] = e.$first = e.$last = e.$index
    proxy.$id = generateID("$proxy$each")
    return proxy
}

function eachProxyAgent(index, data) {
    var param = data.param || "el", proxy
    for (var i = 0, n = eachProxyPool.length; i < n; i++) {
        var candidate = eachProxyPool[i]
        if (candidate && candidate.hasOwnProperty(param)) {
            proxy = candidate
            eachProxyPool.splice(i, 1)
        }
    }
    if (!proxy) {
        proxy = eachProxyFactory(param)
    }
    var host = data.$repeat
    var last = host.length - 1
    proxy.$index = index
    proxy.$first = index === 0
    proxy.$last = index === last
    proxy.$host = host
    proxy.$outer = data.$outer
    proxy.$stamp = data.clone.cloneNode(false)
    proxy.$remove = function() {
        return host.removeAt(proxy.$index)
    }
    return proxy
}

function withProxyFactory() {
    var proxy = modelFactory({
        $key: "",
        $outer: {},
        $host: {},
        $val: {
            get: function() {
                return this.$host[this.$key]
            },
            set: function(val) {
                this.$host[this.$key] = val
            }
        }
    }, {
        $val: 1
    })
    proxy.$id = generateID("$proxy$with")
    return proxy
}

function withProxyAgent(key, data) {
    var proxy = withProxyPool.pop()
    if (!proxy) {
        proxy = withProxyFactory()
    }
    var host = data.$repeat
    proxy.$key = key
    proxy.$host = host
    proxy.$outer = data.$outer
    if (host.$events) {
        proxy.$events.$val = host.$events[key]
    } else {
        proxy.$events = {}
    }
    return proxy
}

function recycleProxies(proxies, type) {
    var proxyPool = type === "each" ? eachProxyPool : withProxyPool
    avalon.each(proxies, function(key, proxy) {
        if (proxy.$events) {
            for (var i in proxy.$events) {
                if (Array.isArray(proxy.$events[i])) {
                    proxy.$events[i].forEach(function(data) {
                        if (typeof data === "object")
                            disposeData(data)
                    })
                    proxy.$events[i].length = 0
                }
            }
            proxy.$host = proxy.$outer = {}
            if (proxyPool.unshift(proxy) > kernel.maxRepeatSize) {
                proxyPool.pop()
            }
        }
    })
    if (type === "each")
        proxies.length = 0
}



