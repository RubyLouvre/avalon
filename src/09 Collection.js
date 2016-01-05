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
        hideProperty(array, "$id", generateID("$"))
        array.notify = function () {
            $emit(heirloom.vm, heirloom.vm, options.pathname)
            batchUpdateEntity(heirloom.vm)
        }

        array._ = sizeCache.shift() || observeObject({
            length: NaN
        }, {}, {
            pathname: "",
            top: true//这里不能使用watch, 因为firefox中对象拥有watch属性
        })

        array._.length = array.length
        array._.$watch("length", {
            type: "watch",
            shouldDispose: function () {
                if (!heirloom || !heirloom.vm ||
                        heirloom.vm.$active === false) {
                    return true
                }
                if (!containsArray(heirloom.vm, array)) {
                    array.length = 0
                    array._.length = NaN
                    if (sizeCache.push(array._) < 64) {
                        sizeCache.shift()
                    }
                    delete array._
                    return true
                }
                return false
            },
            element: {},
            update: function (newlen, oldlen) {
                if (heirloom.vm) {
                    heirloom.vm.$fire(options.pathname + ".length", newlen, oldlen)
                }
            }
        })

        if (W3C) {
            hideProperty(array, "$model", $modelDescriptor)
        } else {
            array.$model = toJson(array)
        }
        var arrayOptions = {
            pathname: "", //options.pathname + ".*",
            top: true
        }
        for (var j = 0, n = array.length; j < n; j++) {
            array[j] = observeItem(array[j], {}, arrayOptions)
        }

        return array
    }
}
var sizeCache = []

function containsArray(vm, array) {
    for (var i in vm) {
        if (vm.hasOwnProperty(i)) {
            if (vm[i] === array) {
                return true
            } else if (vm[i] && vm[i].$id) {
                if (containsArray(vm[i], array)) {
                    return true
                }
            }
        }
    }
    return false
}

function observeItem(item, a, b) {
    if (item && typeof item === "object") {
        return observe(item, a, b)
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
        return this._.length
    },
    removeAll: function (all) { //移除N个元素
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
        this._.length = this.length
    },
    clear: function () {
        this.removeAll()
        return this
    }
}

var _splice = arrayProto.splice

arrayMethods.forEach(function (method) {
    var original = arrayProto[method]
    newProto[method] = function () {
        // 继续尝试劫持数组元素的属性
        var args = []
        for (var i = 0, n = arguments.length; i < n; i++) {
            args[i] = observeItem(arguments[i])
        }
        var result = original.apply(this, args)
        if (!W3C) {
            this.$model = toJson(this)
        }
        this.notify()
        this._.length = this.length
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
