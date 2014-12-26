/*********************************************************************
 *                           依赖调度系统                             *
 **********************************************************************/
var ronduplex = /^(duplex|on)$/

function registerSubscriber(data) {
    Registry[expose] = data //暴光此函数,方便collectSubscribers收集
    avalon.openComputedCollect = true
    var fn = data.evaluator
    if (fn) { //如果是求值函数
        try {
            var c = ronduplex.test(data.type) ? data : fn.apply(0, data.args)
            data.handler(c, data.element, data)
        } catch (e) {
            // log("warning:exception throwed in [registerSubscriber] " + e)
            delete data.evaluator
            var node = data.element
            if (node.nodeType === 3) {
                var parent = node.parentNode
                if (kernel.commentInterpolate) {
                    parent.replaceChild(DOC.createComment(data.value), node)
                } else {
                    node.data = openTag + data.value + closeTag
                }
            }
        }
    }
    avalon.openComputedCollect = false
    delete Registry[expose]
}

function collectSubscribers(list) { //收集依赖于这个访问器的订阅者
    var data = Registry[expose]
    if (list && data && avalon.Array.ensure(list, data) && data.element) { //只有数组不存在此元素才push进去
        addSubscribers(data, list)
    }
}

function addSubscribers(data, list) {
    data.$uuid = data.$uuid || generateID()
    list.$uuid = list.$uuid || generateID()
    var obj = {
        data: data,
        list: list,
        toString: function() {
            return data.$uuid + " " + list.$uuid
        }
    }
    if (!$$subscribers[obj]) {
        $$subscribers[obj] = 1
        $$subscribers.push(obj)
    }
}
var $$subscribers = [],
        $startIndex = 0,
        $maxIndex = 200,
        beginTime = new Date(),
        removeID

function removeSubscribers() {
    for (var i = $startIndex, n = $startIndex + $maxIndex; i < n; i++) {
        var obj = $$subscribers[i]
        if (!obj) {
            break
        }
        var data = obj.data
        var el = data.element
        var remove = el === null ? 1 : (el.nodeType === 1 ? typeof el.sourceIndex === "number" ?
                el.sourceIndex === 0 : !root.contains(el) : !avalon.contains(root, el))
        if (remove) { //如果它没有在DOM树
            $$subscribers.splice(i, 1)
            delete $$subscribers[obj]
            avalon.Array.remove(obj.list, data)
            //log("debug: remove " + data.type)
            disposeData(data)
            obj.data = obj.list = null
            i--
            n--
        }
    }
    obj = $$subscribers[i]
    if (obj) {
        $startIndex = n
    } else {
        $startIndex = 0
    }
    beginTime = new Date()
}
function disposeData(data) {
    data.element = null
    data.rollback && data.rollback()
    for (var key in data) {
        data[key] = null
    }
}

function notifySubscribers(list) { //通知依赖于这个访问器的订阅者更新自身
    clearTimeout(removeID)
    if (new Date() - beginTime > 444) {
        removeSubscribers()
    } else {
        removeID = setTimeout(removeSubscribers, 444)
    }
    if (list && list.length) {
        var args = aslice.call(arguments, 1)
        for (var i = list.length, fn; fn = list[--i]; ) {
            var el = fn.element
            if (el && el.parentNode) {
                if (fn.$repeat) {
                    fn.handler.apply(fn, args) //处理监控数组的方法
                } else if (fn.type !== "on") { //事件绑定只能由用户触发,不能由程序触发
                    var fun = fn.evaluator || noop
                    fn.handler(fun.apply(0, fn.args || []), el, fn)
                }
            }
        }
    }
}
