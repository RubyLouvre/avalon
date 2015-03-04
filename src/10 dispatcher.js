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
           //log("warning:exception throwed in [registerSubscriber] " + e)
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
        $$uuid:  data.$uuid + list.$uuid
    }
    if (!$$subscribers[obj.$$uuid]) {
        $$subscribers[obj.$$uuid] = 1
        $$subscribers.push(obj)
    }
}

function disposeData(data) {
    data.element = null
    data.rollback && data.rollback()
    for (var key in data) {
        data[key] = null
    }
}

function isRemove(el) {
    try {//IE下，如果文本节点脱离DOM树，访问parentNode会报错
        if (!el.parentNode) {
            return true
        }
    } catch (e) {
        return true
    }
    return el.msRetain ? 0 : (el.nodeType === 1 ? typeof el.sourceIndex === "number" ?
            el.sourceIndex === 0 : !root.contains(el) : !avalon.contains(root, el))
}
var $$subscribers = avalon.$$subscribers = []
var beginTime = new Date()
var oldInfo = {}
function removeSubscribers() {
    var i = $$subscribers.length
    var n = i
    var k = 0
    var obj
    var types = []
    var newInfo = {}
    var needTest = {}
    while (obj = $$subscribers[--i]) {
        var data = obj.data
        var type = data.type
        if (newInfo[type]) {
            newInfo[type]++
        } else {
            newInfo[type] = 1
            types.push(type)
        }
    }
    var diff = false
    types.forEach(function(type) {
        if (oldInfo[type] !== newInfo[type]) {
            needTest[type] = 1
            diff = true
        }
    })
    i = n
    //avalon.log("需要检测的个数 " + i)
    if (diff) {
        //avalon.log("有需要移除的元素")
        while (obj = $$subscribers[--i]) {
            data = obj.data
            if (data.element === void 0)
                continue
            if (needTest[data.type] && isRemove(data.element)) { //如果它没有在DOM树
                k++
                $$subscribers.splice(i, 1)
                delete $$subscribers[obj.$$uuid]
                avalon.Array.remove(obj.list, data)
                //log("debug: remove " + data.type)
                disposeData(data)
                obj.data = obj.list = null
            }
        }
    }
    oldInfo = newInfo
   // avalon.log("已经移除的个数 " + k)
    beginTime = new Date()
}

function notifySubscribers(list) { //通知依赖于这个访问器的订阅者更新自身
    if (list && list.length) {
        if (new Date() - beginTime > 444 && typeof list[0] === "object") {
            removeSubscribers()
        }
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
