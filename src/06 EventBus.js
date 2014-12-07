/*********************************************************************
 *                            事件总线                               *
 **********************************************************************/
var EventBus = {
    $watch: function(type, callback) {
        if (typeof callback === "function") {
            var callbacks = this.$events[type]
            if (callbacks) {
                callbacks.push(callback)
            } else {
                this.$events[type] = [callback]
            }
        } else { //重新开始监听此VM的第一重简单属性的变动
            this.$events = this.$watch.backup
        }
        return this
    },
    $unwatch: function(type, callback) {
        var n = arguments.length
        if (n === 0) { //让此VM的所有$watch回调无效化
            this.$watch.backup = this.$events
            this.$events = {}
        } else if (n === 1) {
            this.$events[type] = []
        } else {
            var callbacks = this.$events[type] || []
            var i = callbacks.length
            while (~--i < 0) {
                if (callbacks[i] === callback) {
                    return callbacks.splice(i, 1)
                }
            }
        }
        return this
    },
    $fire: function(type) {
        var special
        if (/^(\w+)!(\S+)$/.test(type)) {
            special = RegExp.$1
            type = RegExp.$2
        }
        var events = this.$events
        var args = aslice.call(arguments, 1)
        var detail = [type].concat(args)
        if (special === "all") {
            for (var i in avalon.vmodels) {
                var v = avalon.vmodels[i]
                if (v !== this) {
                    v.$fire.apply(v, detail)
                }
            }
        } else if (special === "up" || special === "down") {
            var elements = events.expr ? findNodes(events.expr) : []
            if (elements.length === 0)
                return
            for (var i in avalon.vmodels) {
                var v = avalon.vmodels[i]
                if (v !== this) {
                    if (v.$events.expr) {
                        var eventNodes = findNodes(v.$events.expr)
                        if (eventNodes.length === 0) {
                            continue
                        }
                        //循环两个vmodel中的节点，查找匹配（向上匹配或者向下匹配）的节点并设置标识
                        Array.prototype.forEach.call(eventNodes, function(node) {
                            Array.prototype.forEach.call(elements, function(element) {
                                var ok = special === "down" ? element.contains(node) : //向下捕获
                                        node.contains(element) //向上冒泡

                                if (ok) {
                                    node._avalon = v //符合条件的加一个标识
                                }
                            });
                        })
                    }
                }
            }
            var nodes = DOC.getElementsByTagName("*") //实现节点排序
            var alls = []
            Array.prototype.forEach.call(nodes, function(el) {
                if (el._avalon) {
                    alls.push(el._avalon)
                    el._avalon = ""
                    el.removeAttribute("_avalon")
                }
            })
            if (special === "up") {
                alls.reverse()
            }
            for (var i = 0, el; el = alls[i++]; ) {
                if (el.$fire.apply(el, detail) === false) {
                    break
                }
            }
        } else {
            var callbacks = events[type] || []
            var all = events.$all || []
            for (var i = 0, callback; callback = callbacks[i++]; ) {
                if (isFunction(callback))
                    callback.apply(this, args)
            }
            for (var i = 0, callback; callback = all[i++]; ) {
                if (isFunction(callback))
                    callback.apply(this, arguments)
            }
        }
    }
}
