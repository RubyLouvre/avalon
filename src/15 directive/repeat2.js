bindingHandlers.repeat = function(data, vmodels) {
    var type = data.type
    parseExprProxy(data.value, vmodels, data, 0, 1)
    var freturn = false
    vmodels.cb(-1)
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
    var elem = data.element
    elem.removeAttribute(data.name)
    data.sortedCallback = getBindingCallback(elem, "data-with-sorted", vmodels)
    data.renderedCallback = getBindingCallback(elem, "data-" + type + "-rendered", vmodels)

    var comment = data.element = DOC.createComment("ms-repeat")
    var endRepeat = data.endRepeat = DOC.createComment("ms-repeat-end")

    hyperspace.appendChild(comment)
    hyperspace.appendChild(endRepeat)

    if (type === "each" || type === "with") {
        data.template = elem.innerHTML.trim()
        avalon.clearHTML(elem).appendChild(hyperspace)
    } else {
        data.template = elem.outerHTML.trim()
        elem.parentNode.replaceChild(hyperspace, elem)
        data.group = 1
    }

    data.rollback = function() {
        bindingExecutors.repeat.call(data, "clear")
        var elem = data.element
        var parentNode = elem.parentNode
        var content = avalon.parseHTML(data.template)
        var target = content.firstChild
        parentNode.replaceChild(content, elem)
        parentNode.removeChild(data.endRepeat)
        target = data.element = data.type === "repeat" ? target : parentNode
        data.group = target.setAttribute(data.name, data.value)
    }
    var arr = data.value.split(".") || []
    if (arr.length > 1) {
        arr.pop()
        var n = arr[0]
        for (var i = 0, v; v = vmodels[i++]; ) {
            if (v && v.hasOwnProperty(n)) {
                var events = v[n].$events
                events[subscribers] = events[subscribers] || []
                events[subscribers].push(data)
                break
            }
        }
    }
    if (freturn) {
        return
    }

    data.handler = bindingExecutors.repeat
    data.$outer = {}
    var check0 = "$key"
    var check1 = "$val"
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
    if (!Array.isArray($repeat) && type !== "each") {
        var $events = $repeat.$events || {}
        var pool = $events.$withProxyPool
        if (!pool) {
            pool = $events.$withProxyPool = {}
            for (var key in $repeat) {
                if ($repeat.hasOwnProperty(key) && key !== "hasOwnProperty") {
                    pool[key] = withProxyFactory(key, $repeat)
                }
            }
        }
        data.handler("append", $repeat, pool)
    } else {
        data.handler("add", 0, $repeat)
    }
}

"with,each".replace(rword, function(name) {
    bindingHandlers[name] = bindingHandlers.repeat
})

bindingExecutors.repeat = function(method, pos, el) {
    if (method) {
        var data = this
        var parent = data.element.parentNode
        var transation = hyperspace.cloneNode(false)
        if (method === "del" || method === "move") {
            var locatedNode = locateFragment(data, pos)
        }
        var group = data.group
        switch (method) {
            case "add": //在pos位置后添加el数组（pos为数字，el为数组）
                var arr = el
                var fragments = []
                var hasProxy = "$proxies" in data.$repeat
                var proxies = data.$repeat.$proxies || []
                for (var i = 0, n = arr.length; i < n; i++) {
                    var ii = i + pos
                    var proxy = hasProxy ? proxies[ii] : eachProxyFactory(ii, data.$repeat)
                    eachProxyDecorator(proxy, data)
                    shimController(data, transation, proxy, fragments)
                }
                locatedNode = locateFragment(data, pos)
                parent.insertBefore(transation, locatedNode)
                for (var i = 0, fragment; fragment = fragments[i++]; ) {
                    scanNodeArray(fragment.nodes, fragment.vmodels)
                    fragment.nodes = fragment.vmodels = null
                }
                calculateFragmentGroup(data, proxies)
                break
            case "del": //将pos后的el个元素删掉(pos, el都是数字)
                var transation = removeFragment(locatedNode, group, el)
                avalon.clearHTML(transation)
                break
            case "clear":
                while (true) {
                    var node = data.element.nextSibling
                    if (node && node !== data.endRepeat) {
                        parent.removeChild(node)
                    } else {
                        break
                    }
                }
                break
            case "move": //将proxies中的第pos个元素移动el位置上(pos, el都是数字)
                transation = removeFragment(locatedNode, group)
                locatedNode = locateFragment(data, el)
                parent.insertBefore(transation, locatedNode)
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
                        shimController(data, transation, pool[key], fragments)
                    }
                }
                data.proxySize = keys.length
                parent.insertBefore(transation, data.element.nextSibling)
                for (var i = 0, fragment; fragment = fragments[i++]; ) {
                    scanNodeArray(fragment.nodes, fragment.vmodels)
                    fragment.nodes = fragment.vmodels = null
                }
                calculateFragmentGroup(data)
                break
        }
        var callback = data.renderedCallback || noop,
                args = arguments
        checkScan(parent, function() {
            callback.apply(parent, args)
            if (parent.oldValue && parent.tagName === "SELECT" && method === "index") { //fix #503
                avalon(parent).val(parent.oldValue.split(","))
            }
        }, NaN)
    }
}


function shimController(data, transation, proxy, fragments) {
    var dom = avalon.parseHTML(data.template)
    var nodes = avalon.slice(dom.childNodes)
    transation.appendChild(dom)
    proxy.$outer = data.$outer
    var ov = data.vmodels
    var nv = [proxy].concat(ov)
    nv.cb = ov.cb
    var fragment = {
        nodes: nodes,
        vmodels: nv
    }
    fragments.push(fragment)
}
//如果ms-repeat紧挨着ms-repeat-end，那么就返回ms-repeat-end
// 取得用于定位的节点。比如group = 3,  结构为
// <div><!--ms-repeat--><br id="first"><br/><br/><br id="second"><br/><br/><!--ms-repeat-end--></div>
// 当pos为0时,返回 br#first
// 当pos为1时,返回 br#second
// 当pos为2时,返回 ms-repeat-end

function locateFragment(data, pos) {
    var startRepeat = data.element
    var endRepeat = data.endRepeat
    var nodes = []
    var node = startRepeat.nextSibling
    if (node !== endRepeat) {
        do {
            if (node !== endRepeat) {
                nodes.push(node)
            } else {
                break
            }
        } while (node = node.nextSibling)
    }
    return nodes[data.group * pos] || endRepeat
}

function removeFragment(node, group, pos) {
    var n = group * (pos || 1)
    var nodes = [node],
            i = 1
    var view = hyperspace
    while (i < n) {
        node = node.nextSibling
        if (node) {
            nodes[i++] = node
        }
    }
    for (var i = 0; node = nodes[i++]; ) {
        view.appendChild(node)
    }
    return view
}

function calculateFragmentGroup(data, proxies) {
    if (!isFinite(data.group)) {
        var nodes = data.element.parentNode.childNodes
        var length = nodes.length - 2 //去掉两个注释节点
        var n = "proxySize" in data ? data.proxySize : proxies.length
        data.group = length / n
    }
}
// 为ms-each, ms-repeat创建一个代理对象，通过它们能使用一些额外的属性与功能（$index,$first,$last,$remove,$key,$val,$outer）

function eachItemFactory(val, $model) {
    if (rcomplexType.test(avalon.type(val))) {
        val = val.$id ? val : modelFactory(val, 0, $model)
    }
    return val
}
function withProxyFactory(key, host) {
    var $subscribers = !host.$events ? null : (host.$events[key] || (host.$events[key] = []))
    var proxy = {
        $id: ("$proxy$with" + Math.random()).replace(/0\./, ""),
        $subscribers: $subscribers,
        toString: function() {
            return "ProxyVModel"
        },
        $key: key,
        $val: function(v) {
            var a = host[proxy.$key]
            if (arguments.length) {
                host[proxy.$key] = v
            } else {
                return a
            }
        },
        $outer: {}
    }
    return proxy
}

//由于这里的属性最终在求值函数变成， var $first = vm1112323_0.$first(); return $first
//的形式，如果使用了原型，this会错误指向window
function eachProxyFactory(index, host) {
    var proxy = {
        $subscribers: [],
        $$index: index,
        $outer: {},
        toString: function() {
            return "ProxyVModel"
        },
        $index: function() {//1.3.8新增
            if (arguments.length) {
                proxy.$$index = index
            } else {
                return proxy.$$index
            }
        },
        $odd: function() {//1.3.8新增
            return proxy.$$index % 2
        },
        $even: function() {//1.3.8新增
            return proxy.$$index & 1 === 0
        },
        $first: function() {
            return proxy.$$index === index
        },
        $last: function() {
            var last = host.length - 1
            return proxy.$$index === last
        },
        $remove: function() {
            return host.removeAt(proxy.$$index)
        }
    }
    return proxy
}


function eachProxyDecorator(proxy, data) {
    var param = data.param || "el"
    proxy.$id = ("$proxy$" + data.type + Math.random()).replace(/0\./, "")
    proxy[param] = function(val) {
        if (arguments.length) {
            data.$repeat.set(proxy.$$index, val)
        } else {
            return data.$repeat[proxy.$$index]
        }
    }
    return proxy
}

function proxyCinerator(array) {
    var data
    for (var i in array) {
        var proxy = array[i]
        while (data = proxy.$subscribers.pop()) {
            disposeData(data)
        }
    }
    array.length = 0
}
