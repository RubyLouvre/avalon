 /*********************************************************************
     *          监控数组（与ms-each, ms-repeat配合使用）                     *
     **********************************************************************/

    function Collection(model) {
        var array = []
        array.$id = generateID()
        array.$model = model //数据模型
        array.$events = {}
        array.$proxies = []  //装载所有VM数组
        array.$events[subscribers] = []//装载所有元素节点的ms-repeat属性转换而来的数据
        array._ = modelFactory({
            length: model.length
        })
        for (var i in EventBus) {
            array[i] = EventBus[i]
        }
        avalon.mix(array, CollectionPrototype)
        array._.$watch("length", function(a, b) {
            array.$fire("length", a, b)
        })
        return array
    }

    var _splice = ap.splice
    var CollectionPrototype = {
        _splice: _splice,
        _fire: function(method, a, b) {
            notifySubscribers(this.$events[subscribers], method, a, b)
        },
        _add: function(arr, pos) { //在第pos个位置上，添加一组元素
            var oldLength = this.length
            pos = typeof pos === "number" ? pos : oldLength
            var added = []
            var proxies = []
            for (var i = 0, n = arr.length; i < n; i++) {
                var index = pos + i
                added[i] = eachItemFactory(arr[i], this.$model[index]) //将对象数组转换为VM数组
                proxies[i] = eachProxyFactory(index, this)//生成对应的代理VM数组
            }
            _splice.apply(this, [pos, 0].concat(added))
            _splice.apply(this.$proxies, [pos, 0].concat(proxies))
            this._fire("add", pos, added)
            if (!this._stopFireLength) {
                return this._.length = this.length
            }
        },
        _del: function(pos, n) { //在第pos个位置上，删除N个元素
            var ret = this._splice(pos, n)
            var proxies = this.$proxies.splice(pos, n)
            if (ret.length) {
                proxyCinerator(proxies)
                this._fire("del", pos, n)
                if (!this._stopFireLength) {
                    this._.length = this.length
                }
            }
            return ret
        },
        _index: function(pos) {
            var proxies = this.$proxies
            for (var n = proxies.length; pos < n; pos++) {
                var el = proxies[pos]
                el.$$index = pos
                notifySubscribers(el.$subscribers)
            }
        },
        push: function() {
            var pos = this.length
            ap.push.apply(this.$model, arguments)
            this._add(arguments)
            this._index(pos)
            return this.length
        },
        pushArray: function(array) {
            return this.push.apply(this, array)
        },
        unshift: function() {
            ap.unshift.apply(this.$model, arguments)
            this._add(arguments, 0)
            this._index(0)
            return this.length //IE67的unshift不会返回长度
        },
        shift: function() {
            var el = this.$model.shift()
            this._del(0, 1)
            this._index(0)
            return el //返回被移除的元素
        },
        pop: function() {
            var el = this.$model.pop()
            this._del(this.length - 1, 1)
            return el //返回被移除的元素
        },
        size: function() { //取得数组长度，这个函数可以同步视图，length不能
            return this._.length
        },
        splice: function(must) {
            // 必须存在第一个参数，需要大于-1, 为添加或删除元素的基点
            var a = _number(must, this.length)
            var removed = _splice.apply(this.$model, arguments)
            var ret = [], change
            this._stopFireLength = true //确保在这个方法中 , $watch("length",fn)只触发一次
            if (removed.length) {
                ret = this._del(a, removed.length)
                change = true
            }
            if (arguments.length > 2) {
                this._add(aslice.call(arguments, 2), a)
                change = true
            }
            this._stopFireLength = false
            this._.length = this.length
            if (change) {
                this._index(0)
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
            proxyCinerator(this.$proxies)
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
                    this[index] = this.$model[index] = val
                    var el = this.$proxies[index]
                    notifySubscribers(el.$subscribers)
                }
            }
            return this
        }
    }

    "sort,reverse".replace(rword, function(method) {
        CollectionPrototype[method] = function(fn) {
            var aaa = this.$model
            var bbb = aaa.slice(0) //生成参照物数组
            var proxies = this.$proxies
            var sorted = false
            ap[method].apply(aaa, arguments) //移动$model数组
            for (var i = 0, n = bbb.length; i < n; i++) {
                var a = aaa[i]
                var b = bbb[i]
                if (!isEqual(a, b)) {
                    sorted = true
                    //移动参照物数组
                    var index = bbb.indexOf(a, i)
                    bbb[i] = bbb[index]
                    bbb[index] = b
                    //移动VM数组
                    var c = this[i]
                    this[i] = this[index]
                    this[index] = c
                    //移动代理VM数组
                    var d = proxies.splice(index, 1)[0]
                    proxies.splice(i, 0, d)
                    //移动节点数组
                    this._fire("move", index, i)
                }
            }
            bbb = void 0
            if (sorted) {
                this._index(0)
            }
            return this
        }
    })

