/* 
 * ArrayFactory的原型对象
 */

import {warlords} from './warlords'

function notifySize(array, size) {
    if (array.length !== size) {
        array.notify('length', array.length, size, true)
    }
}

export var __array__ = {
    set: function (index, val) {
        if (((index >>> 0) === index) && this[index] !== val) {
            if (index > this.length) {
                throw Error(index + 'set方法的第一个参数不能大于原数组长度')
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
    clear: function () {
        this.removeAll()
        return this
    }
}



var ap = Array.prototype
var _splice = ap.splice
__array__.removeAll = function (all) { //移除N个元素
    var size = this.length
    if (Array.isArray(all)) {
        for (var i = this.length - 1; i >= 0; i--) {
            if (all.indexOf(this[i]) !== -1) {
                _splice.call(this, i, 1)
            }
        }
    } else if (typeof all === 'function') {
        for (i = this.length - 1; i >= 0; i--) {
            var el = this[i]
            if (all(el, i)) {
                _splice.call(this, i, 1)
            }
        }
    } else {
        _splice.call(this, 0, this.length)
    }
    warlords.toModel(this)
    notifySize(this, size)
    this.notify()
}


var __method__ = ['push', 'pop', 'shift', 'unshift', 'splice']

__method__.forEach(function (method) {
    var original = ap[method]
    __array__[method] = function (a, b) {
        // 继续尝试劫持数组元素的属性
        var args = [], size = this.length

        if (method === 'splice' && Object(this[0]) === this[0]) {
            var old = this.slice(a, b)
            var neo = ap.slice.call(arguments, 2)
            var args = [a, b]
            for (var j = 0, jn = neo.length; j < jn; j++) {
                var item = old[j]

                args[j + 2] = warlords.modelAdaptor(neo[j], item, (item && item.$events || {}), {
                    id: this.$id + '.*',
                    master: true
                })
            }

        } else {
            for (var i = 0, n = arguments.length; i < n; i++) {
                args[i] = warlords.modelAdaptor(arguments[i], 0, {}, {
                    id: this.$id + '.*',
                    master: true
                })
            }
        }
        var result = original.apply(this, args)
        warlords.toModel(this)
        notifySize(this, size)
        this.notify()
        return result
    }
})

'sort,reverse'.replace(/\w+/g, function (method) {
    __array__[method] = function () {
        ap[method].apply(this, arguments)
        warlords.toModel(this)
        this.notify()
        return this
    }
})

