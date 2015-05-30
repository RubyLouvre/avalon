bindingHandlers.repeat = function (data, vmodels) {
    var type = data.type
    parseExprProxy(data.value, vmodels, data, 0, 1)
    var freturn = false
    try {
        var $repeat = data.$repeat = data.evaluator.apply(0, data.args || [])
        var xtype = avalon.type($repeat)
        if (xtype !== "object" && xtype !== "array") {
            freturn = true
            avalon.log("warning:" + data.value + "只能是对象或数组")
        }
    } catch (e) {
        freturn = true
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
    elem.removeAttribute(data.name)
    data.sortedCallback = getBindingCallback(elem, "data-with-sorted", vmodels)
    data.renderedCallback = getBindingCallback(elem, "data-" + type + "-rendered", vmodels)
    var signature = generateID(type)
    var comment = data.element = DOC.createComment(signature + ":end")
    data.clone = DOC.createComment(signature)
    hyperspace.appendChild(comment)

    if (type === "each" || type === "with") {
        data.template = elem.innerHTML.trim()
        avalon.clearHTML(elem).appendChild(comment)
    } else {
        data.template = elem.outerHTML.trim()
        elem.parentNode.replaceChild(comment, elem)
    }
    data.template = avalon.parseHTML(data.template)
    data.handler = bindingExecutors.repeat
    data.rollback = function () {
        var elem = data.element
        if (!elem)
            return
        data.handler("clear")
        var parentNode = elem.parentNode
        var content = data.template
        var target = content.firstChild
        parentNode.replaceChild(content, elem)
        var start = data.$with
        start && start.parentNode && start.parentNode.removeChild(start)
        target = data.element = data.type === "repeat" ? target : parentNode
    }
    if (freturn) {
        return
    }

    data.$outer = {}
    var check0 = "$key"
    var check1 = "$val"
    if (Array.isArray($repeat)) {
        if (!$repeat.$map) {
            $repeat.$map = {
                el: 1
            }
            var m = $repeat.length
            var $proxy = []
            for ( i = 0; i < m; i++) {//生成代理VM
                $proxy.push(eachProxyAgent(i, $repeat))
            }
            $repeat.$proxy = $proxy
        }
        $repeat.$map[data.param || "el"] = 1
        check0 = "$first"
        check1 = "$last"
    }
    for (i = 0; v = vmodels[i++]; ) {
        if (v.hasOwnProperty(check0) && v.hasOwnProperty(check1)) {
            data.$outer = v
            break
        }
    }
    var $events = $repeat.$events
    var $list = ($events || {})[subscribers]
    injectDependency($list, data)
    if (xtype === "object") {
        data.$with = true
        $repeat.$proxy || ($repeat.$proxy = {})
        data.handler("append", $repeat)
    } else if ($repeat.length) {
        data.handler("add", 0, $repeat.length)
    }
}

bindingExecutors.repeat = function (method, pos, el) {
    if (method) {
        var data = this, start, fragment
        var end = data.element
        var comments = getComments(data)
        var parent = end.parentNode
        var transation = hyperspace.cloneNode(false)
        switch (method) {
            case "add": //在pos位置后添加el数组（pos为插入位置,el为要插入的个数）
                var n = pos + el
                var fragments = []
                var array = data.$repeat
                for (var i = pos; i < n; i++) {
                    var proxy = array.$proxy[i]
                    proxy.$outer = data.$outer
                    shimController(data, transation, proxy, fragments)
                }
                parent.insertBefore(transation, comments[pos] || end)
                for (i = 0; fragment = fragments[i++]; ) {
                    scanNodeArray(fragment.nodes, fragment.vmodels)
                    fragment.nodes = fragment.vmodels = null
                }
                break
            case "del": //将pos后的el个元素删掉(pos, el都是数字)
                sweepNodes(comments[pos], comments[pos + el] || end)
                break
            case "clear":
                start = comments[0]
                if (start) {
                    sweepNodes(start, end)
                }
                break
            case "move":
                start = comments[0]
                if (start) {
                    var signature = start.nodeValue
                    var rooms = []
                    var room = [],
                            node
                    sweepNodes(start, end, function () {
                        room.unshift(this)
                        if (this.nodeValue === signature) {
                            rooms.unshift(room)
                            room = []
                        }
                    })
                    sortByIndex(rooms, pos)
                    while (room = rooms.shift()) {
                        while (node = room.shift()) {
                            transation.appendChild(node)
                        }
                    }
                    parent.insertBefore(transation, end)
                }
                break
            case "append":
                var object = pos //原来第2参数， 被循环对象
                var pool = object.$proxy   //代理对象组成的hash
                var keys = []
                fragments = []
                for (var key in pool) {
                    if (!object.hasOwnProperty(key)) {
                        proxyRecycler(pool[key], withProxyPool) //去掉之前的代理VM
                        delete(pool[key])
                    }
                }
                for (key in object) { //得到所有键名
                    if (object.hasOwnProperty(key) && key !== "hasOwnProperty" && key !== "$proxy") {
                        keys.push(key)
                    }
                }
                if (data.sortedCallback) { //如果有回调，则让它们排序
                    var keys2 = data.sortedCallback.call(parent, keys)
                    if (keys2 && Array.isArray(keys2) && keys2.length) {
                        keys = keys2
                    }
                }

                for (i = 0; key = keys[i++]; ) {
                    if (key !== "hasOwnProperty") {
                        pool[key] = withProxyAgent(pool[key], key, data)
                        shimController(data, transation, pool[key], fragments)
                    }
                }
                var comment = data.$with = data.clone
                parent.insertBefore(comment, end)
                parent.insertBefore(transation, end)
                for (i = 0; fragment = fragments[i++]; ) {
                    scanNodeArray(fragment.nodes, fragment.vmodels)
                    fragment.nodes = fragment.vmodels = null
                }
                break
        }
        if (method === "clear")
            method = "del"
        var callback = data.renderedCallback || noop,
                args = arguments
        checkScan(parent, function () {
            callback.apply(parent, args)
            if (parent.oldValue && parent.tagName === "SELECT") { //fix #503
                avalon(parent).val(parent.oldValue.split(","))
            }
        }, NaN)
    }
}

"with,each".replace(rword, function (name) {
    bindingHandlers[name] = bindingHandlers.repeat
})
avalon.pool = eachProxyPool
function shimController(data, transation, proxy, fragments) {
    var content = data.template.cloneNode(true)
    var nodes = avalon.slice(content.childNodes)
    if (!data.$with) {
        content.insertBefore(data.clone.cloneNode(false), content.firstChild)
    }
    transation.appendChild(content)
    var nv = [proxy].concat(data.vmodels)
    var fragment = {
        nodes: nodes,
        vmodels: nv
    }
    fragments.push(fragment)
}

function getComments(data) {
    var end = data.element
    var signature = end.nodeValue.replace(":end", "")
    var node = end.previousSibling
    var array = []
    while (node) {
        if (node.nodeValue === signature) {
            array.unshift(node)
        }
        node = node.previousSibling
    }
    return array
}


//移除掉start与end之间的节点(保留end)
function sweepNodes(start, end, callback) {
    while (true) {
        var node = end.previousSibling
        if (!node)
            break
        node.parentNode.removeChild(node)
        callback && callback.call(node)
        if (node === start) {
            break
        }
    }
}

// 为ms-each,ms-with, ms-repeat会创建一个代理VM，
// 通过它们保持一个下上文，让用户能调用$index,$first,$last,$remove,$key,$val,$outer等属性与方法
// 所有代理VM的产生,消费,收集,存放通过xxxProxyFactory,xxxProxyAgent, recycleProxies,xxxProxyPool实现
var withProxyPool = []
function withProxyFactory() {
    var proxy = modelFactory({
        $key: "",
        $outer: {},
        $host: {},
        $val: {
            get: function () {
                return this.$host[this.$key]
            },
            set: function (val) {
                this.$host[this.$key] = val
            }
        }
    }, {
        $val: 1
    })
    proxy.$id = generateID("$proxy$with")
    return proxy
}

function withProxyAgent(proxy, key, data) {
    proxy = proxy || withProxyPool.pop()
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

function eachProxyRecycler(proxies) {
    proxies.forEach(function (proxy) {
        proxyRecycler(proxy, eachProxyPool)
    })
    proxies.length = 0
}

function proxyRecycler(proxy, proxyPool) {
    for (var i in proxy.$events) {
        if (Array.isArray(proxy.$events[i])) {
            proxy.$events[i].forEach(function (data) {
                if (typeof data === "object")
                    disposeData(data)
            })// jshint ignore:line
            proxy.$events[i].length = 0
        }
    }
    proxy.$host = proxy.$outer = {}
    if (proxyPool.unshift(proxy) > kernel.maxRepeatSize) {
        proxyPool.pop()
    }
}