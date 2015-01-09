/*********************************************************************
 *          监控数组（与ms-each, ms-repeat配合使用）                     *
 **********************************************************************/

function Collection(model) {
    var array = []
    array.$id = generateID()
    array.$model = model //数据模型
    array.$events = {}
    array.$events[subscribers] = []
    array._ = modelFactory({
        length: model.length
    })
    array._.$watch("length", function(a, b) {
        array.$fire("length", a, b)
    })
    for (var i in EventBus) {
        array[i] = EventBus[i]
    }
    avalon.mix(array, CollectionPrototype)
    return array
}

var _splice = ap.splice
var CollectionPrototype = {
    _splice: _splice,
    _fire: function(method, a, b) {
        notifySubscribers(this.$events[subscribers], method, a, b)
    },
    _add: function(pos, n) { //在第pos个位置上，添加n个元素

        var array = this.$model.slice(pos, pos + n)
        array = array.map(function(el) {
            if (rcomplexType.test(avalon.type(el))) {
                return el.$id ? el : modelFactory(el, 0, el)
            } else {
                return el
            }
        })
      //  console.log(array)
        _splice.apply(this, [pos, 0].concat(array))
     //   console.log(this)
        this._fire("add", pos, n)
        if (!this._stopFireLength) {
            return this._.length = this.length
        }
    },
    _del: function(pos, n) { //在第pos个位置上，删除N个元素
        var ret = this._splice(pos, n)
        if (ret.length) {
            this._fire("del", pos, n)
            if (!this._stopFireLength) {
                this._.length = this.length
            }
        }
        return ret
    },
    size: function() { //取得数组长度，这个函数可以同步视图，length不能
        return this._.length
    },
    pushArray: function(array) {
        var m = array.length, n = this.length
        if (m) {
            ap.push.apply(this.$model, array)
            this._add(n, m)
            this._fire("index", n)
        }
        return m + n
    },
    push: function() {
        return this.pushArray(arguments)
    },
    unshift: function() {
        var m = arguments.length, n = this.length
        if (m) {
            ap.unshift.apply(this.$model, arguments)
            this._add(0, m)
            this._fire("index", 0) //重置所有索引
        }
        return m + n //IE67的unshift不会返回长度
    },
    shift: function() {
        var el = this.$model.shift()
        this._del(0, 1)
        this._fire("index", 0)
        return el //返回被移除的元素
    },
    pop: function() {
        var el = this.$model.pop()
        this._del(this.length - 1, 1)
        return el //返回被移除的元素
    },
    splice: function(a, b) {
        // 必须存在第一个参数，需要大于-1, 为添加或删除元素的基点
        var m = arguments.length, n = this.length
        a = _number(a, n)
        var removed = _splice.apply(this.$model, arguments),
                ret = [],
                change
        this._stopFireLength = true //确保在这个方法中 , $watch("length",fn)只触发一次
        if (removed.length) {
            ret = this._del(a, removed.length)
            change = true
        }
        if (m > 2) {
            this._add(a, m - 2)
            change = true
        }
        this._stopFireLength = false
        this._.length = this.length
        if (change) {
            this._fire("index", a)
        }
        return ret //返回被移除的元素
    },
    contains: function(el) { //判定是否包含
        return this.indexOf(el) !== -1
    },
    remove: function(el) { //移除第一个等于给定值的元素
        return this.removeAt(this.indexOf(el))
    },
    removeAt: function(index) { //移除指定索引上的元素
        return index >= 0 ? this.splice(index, 1) : []
    },
    clear: function() {
        this.$model.length = this.length = this._.length = 0 //清空数组
        this._fire("clear", 0)
        return this
    },
    removeAll: function(all) { //移除N个元素
        if (Array.isArray(all)) {
            all.forEach(function(el) {
                this.remove(el)
            }, this)
        } else if (typeof all === "function") {
            for (var i = this.length - 1; i >= 0; i--) {
                var el = this[i]
                if (all(el, i)) {
                    this.splice(i, 1)
                }
            }
        } else {
            this.clear()
        }
    },
    ensure: function(el) {
        if (!this.contains(el)) { //只有不存在才push
            this.push(el)
        }
        return this
    },
    set: function(index, val) {
        if (index >= 0) {
            var valueType = avalon.type(val)
            if (val && val.$model) {
                val = val.$model
            }
            var target = this[index]
            if (valueType === "object") {
                for (var i in val) {
                    if (target.hasOwnProperty(i)) {
                        target[i] = val[i]
                    }
                }
            } else if (valueType === "array") {
                target.clear().push.apply(target, val)
            } else if (target !== val) {
                this[index] = val
                this.$model[index] = val
                this._fire("set", index, val)
            }
        }
        return this
    }
}
"sort,reverse".replace(rword, function(method) {
    CollectionPrototype[method] = function() {
        var aaa = this.$model,
                bbb = aaa.slice(0),
                sorted = false
        ap[method].apply(aaa, arguments) //先移动model
        for (var i = 0, n = bbb.length; i < n; i++) {
            var a = aaa[i],
                    b = bbb[i]
            if (!isEqual(a, b)) {
                sorted = true
                var index = bbb.indexOf(a, i)
                var remove = this._splice(index, 1)[0]
                var remove2 = bbb.splice(index, 1)[0]
                this._splice(i, 0, remove)
                bbb.splice(i, 0, remove2)
                this._fire("move", index, i)
            }
        }
        bbb = void 0
        if (sorted) {
            this._fire("index", 0)
        }
        return this
    }
})

function convert(val, $model) {
    if (rcomplexType.test(avalon.type(val))) {
        val = val.$id ? val : modelFactory(val, 0, $model)
    }
    return val
}
