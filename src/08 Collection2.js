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

function mutateArray(method, pos, n, index, method2, pos2, n2) {
    var oldLen = this.length, loop = 2
    while (--loop) {
        switch (method) {
            case "add":
                var array = this.$model.slice(pos, pos + n).map(function(el) {
                    if (rcomplexType.test(avalon.type(el))) {
                        return el.$id ? el : modelFactory(el, 0, el)
                    } else {
                        return el
                    }
                })
                _splice.apply(this, [pos, 0].concat(array))
                this._fire("add", pos, n)
                break
            case "del":
                var ret = this._splice(pos, n)
                this._fire("del", pos, n)
                break
        }
        if (method2) {
            method = method2
            pos = pos2
            n = n2
            loop = 2
            method2 = 0
        }
    }
    this._fire("index", index)
    if (this.length !== oldLen) {
        this._.length = this.length
    }
    return ret
}

var _splice = ap.splice
var CollectionPrototype = {
    _splice: _splice,
    _fire: function(method, a, b) {
        var list = this.$events[subscribers]
        for (var i = 0, fn; fn = list[i++]; ) {
            if (fn.$repeat) {
                fn.handler.call(fn, method, a, b) //处理监控数组的方法
            }
        }
    },
    size: function() { //取得数组长度，这个函数可以同步视图，length不能
        return this._.length
    },
    pushArray: function(array) {
        var m = array.length, n = this.length
        if (m) {
            ap.push.apply(this.$model, array)
            mutateArray.call(this, "add", n, m, n)
        }
        return  m + n
    },
    push: function() {
        //http://jsperf.com/closure-with-arguments
        var array = []
        var i, n = arguments.length
        for (i = 0; i < n; i++) {
            array[i] = arguments[i]
        }
        return this.pushArray(arguments)
    },
    unshift: function() {
        var m = arguments.length, n = this.length
        if (m) {
            ap.unshift.apply(this.$model, arguments)
            mutateArray.call(this, "add", 0, m, 0)
        }
        return  m + n //IE67的unshift不会返回长度
    },
    shift: function() {
        if (this.length) {
            var el = this.$model.shift()
            mutateArray.call(this, "del", 0, 1, 0)
            return el //返回被移除的元素
        }
    },
    pop: function() {
        var m = this.length
        if (m) {
            var el = this.$model.pop()
            mutateArray.call(this, "del", m - 1, 1, Math.max(0, m - 2))
            return el //返回被移除的元素
        }
    },
    splice: function(start) {
        var m = arguments.length, args = [], change
        var removed = _splice.apply(this.$model, arguments)
        if (removed.length) { //如果用户删掉了元素
            args.push("del", start, removed.length, 0)
            change = true
        }
        if (m > 2) {  //如果用户添加了元素
            args.splice(3, 1, 0, "add", start, m - 2)
            change = true
        }
        if (change) { //返回被移除的元素
            return mutateArray.apply(this, args)
        } else {
            return []
        }
    },
    contains: function(el) { //判定是否包含
        return this.indexOf(el) !== -1
    },
    remove: function(el) { //移除第一个等于给定值的元素
        return this.removeAt(this.indexOf(el))
    },
    removeAt: function(index) { //移除指定索引上的元素
        if (index >= 0) {
            this.$model.splice(index, 1)
            return mutateArray.call(this, "del", index, 1, 0)
        }
        return  []
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
                    this.removeAt(i)
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

function sortByIndex(array, indexes) {
    var map = {};
    for (var i = 0, n = indexes.length; i < n; i++) {
        map[i] = array[i] // preserve
        var j = indexes[i]
        if (j in map) {
            array[i] = map[j]
            delete map[j]
        } else {
            array[i] = array[j]
        }
    }
}
function sortFn(x, y) {
    if (x === y)
        return 0
    if ((typeof x === "string") && (typeof y === "string"))
        return String(x).localeCompare(y)
    x = x + ""
    y = y + ""
    return x === y ? 0 : x < y ? -1 : 1
}
function reverseFn() {
    return 1
}
"sort,reverse".replace(rword, function(method) {
    CollectionPrototype[method] = function(fn) {
        var array = this.$model//这是要排序的新数组
        var compareFn = method == "reverse" ? reverseFn : typeof fn === "function" ? fn : sortFn
        var hasSort = false
        var indexes = array.map(function(el, i) {
            return {
                data: el,
                index: i
            }
        }).sort(function(a, b) {
            var r = compareFn(a.data, b.data)
            if (!hasSort) {
                hasSort = r
            }
            return r
        }).map(function(el, i) {
            array[i] = el.data
            return el.index
        })
        if (hasSort) {
            sortByIndex(this, indexes)
            this._fire("move", indexes)
            this._fire("index", 0)
        }
        return this
    }
})
