import { avalon, ap, platform, modern, isObject } from '../seed/core'
import { Mutation } from './Mutation'

var _splice = ap.splice
var __array__ = {
    set: function(index, val) {
        if (((index >>> 0) === index) && this[index] !== val) {
            if (index > this.length) {
                throw Error(index + 'set方法的第一个参数不能大于原数组长度')
            }
            this.splice(index, 1, val)
        }
    },
    toJSON: function() {
        //为了解决IE6-8的解决,通过此方法显式地求取数组的$model
        return this.$model = platform.toJson(this)
    },
    contains: function(el) { //判定是否包含
        return this.indexOf(el) !== -1
    },
    ensure: function(el) {
        if (!this.contains(el)) { //只有不存在才push
            this.push(el)
            return true
        }
        return false
    },
    pushArray: function(arr) {
        return this.push.apply(this, arr)
    },
    remove: function(el) { //移除第一个等于给定值的元素
        return this.removeAt(this.indexOf(el))
    },
    removeAt: function(index) { //移除指定索引上的元素
        if ((index >>> 0) === index) {
            return this.splice(index, 1)
        }
        return []
    },
    clear: function() {
        this.removeAll()
        return this
    },
    removeAll: function(all) { //移除N个元素
        var size = this.length
        var eliminate = Array.isArray(all) ?
            function(el) {
                return all.indexOf(el) !== -1
            } : typeof all === 'function' ?
            all : false

        if (eliminate) {
            for (var i = this.length - 1; i >= 0; i--) {
                if (eliminate(this[i], i)) {
                    _splice.call(this, i, 1)
                }
            }
        } else {
            _splice.call(this, 0, this.length)
        }
        this.toJSON()
        this.$events.__dep__.notify()
    }
}
export function hijackMethods(array) {
    for (var i in __array__) {
        platform.hideProperty(array, i, __array__[i])
    }
}
var __method__ = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']

__method__.forEach(function(method) {
    var original = ap[method]
    __array__[method] = function() {
        // 继续尝试劫持数组元素的属性
        var core = this.$events

        var args = platform.listFactory(arguments, true, core.__dep__)
        var result = original.apply(this, args)

        this.toJSON()
        core.__dep__.notify(method)
        return result
    }
})

export function listFactory(array, stop, dd) {
    if (!stop) {
        hijackMethods(array)
        if (modern) {
            Object.defineProperty(array, '$model', platform.modelAccessor)
        }
        platform.hideProperty(array, '$hashcode', avalon.makeHashCode('$'))
        platform.hideProperty(array, '$events', { __dep__: dd || new Mutation })
    }
    var _dd = array.$events && array.$events.__dep__
    for (var i = 0, n = array.length; i < n; i++) {
        var item = array[i]
        if (isObject(item)) {
            array[i] = platform.createProxy(item, _dd)
        }
    }
    return array
}

platform.listFactory = listFactory