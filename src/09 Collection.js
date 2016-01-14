/*********************************************************************
 *          监控数组（与ms-each, ms-repeat配合使用）                     *
 **********************************************************************/
function observeArray(array, old, heirloom, options) {
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
        
        array.notify = function (a, b, c) {
            var vm = heirloom.vm
            if (vm) {
                var path = a != null ? options.pathname + "." + a : options.pathname
                path = path.replace(vm.$id + ".", "")
                $emit(vm.$events[path], vm, path, b, c)
            }
        }

        if (W3C) {
            hideProperty(array, "$model", $modelDescriptor)
        } else {
            array.$model = toJson(array)
        }

        var arrayOptions = {
            pathname: options.pathname + ".*",
            top: true
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

var arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice']
var arrayProto = Array.prototype
var newProto = {
    set: function (index, val) {
        if (((index >>> 0) === index) && this[index] !== val) {
            if (index > this.length) {
                throw Error(index + "set方法的第一个参数不能大于原数组长度")
            }

            this.notify("*", val, this[index])
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
    size: function () { //取得数组长度，这个函数可以同步视图，length不能
        avalon.log("warnning: array.size()将被废弃！")
        return this.length
    },
    removeAll: function (all) { //移除N个元素
        var on = this.length
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
        this.notify()
        notifySize(this, on)
    },
    clear: function () {
        this.removeAll()
        return this
    }
}

function notifySize(array, on) {
    if (array.length !== on) {
        array.notify("size", array.length, on)
        array.notify("length", array.length, on)
    }
}

var _splice = arrayProto.splice

arrayMethods.forEach(function (method) {
    var original = arrayProto[method]
    newProto[method] = function () {
        // 继续尝试劫持数组元素的属性
        var args = [], on = this.length
        
        for (var i = 0, n = arguments.length; i < n; i++) {
            args[i] = observeItem(arguments[i], {}, {
                pathname: this.$id + ".*",
                top: true
            })
        }
        var result = original.apply(this, args)
        if (!W3C) {
            this.$model = toJson(this)
        }
        this.notify()
        notifySize(this, on)
        return result
    }
})

"sort,reverse".replace(rword, function (method) {
    newProto[method] = function () {
        arrayProto[method].apply(this, arguments)
        if (!W3C) {
            this.$model = toJson(this)
        }
        this.notify()
        return this
    }
})
