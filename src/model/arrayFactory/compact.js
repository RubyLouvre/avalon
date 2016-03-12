function arrayFactory(array, old, heirloom, options) {
    if (old && old.splice) {
        var args = [0, old.length].concat(array)
        old.splice.apply(old, args)
        return old
    } else {
        for (var i in newProto) {
            array[i] = newProto[i]
        }
        var hashcode = makeHashCode("$")
        hideProperty(array, "$hashcode", hashcode)
        hideProperty(array, "$id", options.idname || hashcode)
        if (options.master === true) {
            makeFire(array, heirloom)
        }
        array.notify = function (a, b, c, d) {
            var vm = heirloom.__vmodel__
            if (vm) {
                var path = a === null || a === void 0 ?
                        options.pathname :
                        options.pathname + "." + a
                vm.$fire(path, b, c)
                if (!d) {
                    avalon.rerenderStart = new Date
                    avalon.batch(vm.$id, true)
                }
            }
        }
        if (W3C) {
            hideProperty(array, "$model", $modelAccessor)
        } else {
            array.$model = toJson(array)
        }
        var arrayOptions = {
            id: array.$id + ".*",
            master: true
        }
        for (var j = 0, n = array.length; j < n; j++) {
            array[j] = observeItem(array[j], {}, arrayOptions)
        }
        return array
    }
}
function observeItem(item, a, b) {
    if (avalon.isObject(item)) {
        return observe(item, 0, a, b)
    } else {
        return item
    }
}
var ap = Array.prototype

var arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice']
var newProto = {
    set: function (index, val) {
        if (((index >>> 0) === index) && this[index] !== val) {
            if (index > this.length) {
                throw Error(index + "set方法的第一个参数不能大于原数组长度")
            }
            this.notify("*", val, this[index], true)
            this.splice(index, 1, val)
        }
    },
    contains: function (el) { //判定是否包含
        return this.indexOf(el) !== -1
    },
    ensure: function (el) {
        if (!this.contains(el)) { //只有不存在才push
            this.push(el)
        }
        return this
    },
    pushArray: function (arr) {
        return this.push.apply(this, arr)
    },
    remove: function (el) { //移除第一个等于给定值的元素
        return this.removeAt(this.indexOf(el))
    },
    removeAt: function (index) { //移除指定索引上的元素
        if ((index >>> 0) === index) {
            return this.splice(index, 1)
        }
        return []
    },
    removeAll: function (all) { //移除N个元素
        var size = this.length
        if (Array.isArray(all)) {
            for (var i = this.length - 1; i >= 0; i--) {
                if (all.indexOf(this[i]) !== -1) {
                    _splice.call(this, i, 1)
                }
            }
        } else if (typeof all === "function") {
            for (i = this.length - 1; i >= 0; i--) {
                var el = this[i]
                if (all(el, i)) {
                    _splice.call(this, i, 1)
                }
            }
        } else {
            _splice.call(this, 0, this.length)

        }
        if (!W3C) {
            this.$model = toJson(this)
        }
        notifySize(this, size)
        this.notify()

    },
    clear: function () {
        this.removeAll()
        return this
    }
}

function notifySize(array, size) {
    if (array.length !== size) {
        array.notify("length", array.length, size, true)
    }
}

var _splice = ap.splice

arrayMethods.forEach(function (method) {
    var original = ap[method]
    newProto[method] = function (a, b) {
        // 继续尝试劫持数组元素的属性
        var args = [], size = this.length
        var options = {
            idname: this.$id + ".*",
            top: true
        }
        if (method === "splice" && this[0] && typeof this[0] === "object") {
            var old = this.slice(a, b)
            var neo = ap.slice.call(arguments, 2)
            var args = [a, b]
            for (var j = 0, jn = neo.length; j < jn; j++) {
                args[j + 2] = observe(neo[j], old[j], old[j] && old[j].$events, options)
            }
        } else {
            for (var i = 0, n = arguments.length; i < n; i++) {
                args[i] = observeItem(arguments[i], {}, options)
            }
        }


        var result = original.apply(this, args)
        if (!W3C) {
            this.$model = toJson(this)
        }
        notifySize(this, size)
        this.notify()

        return result
    }
})

"sort,reverse".replace(rword, function (method) {
    newProto[method] = function () {
        ap[method].apply(this, arguments)
        if (!W3C) {
            this.$model = toJson(this)
        }
        this.notify()
        return this
    }
})

module.exports = arrayFactory