var share = require('./parts/share')
var canObserve = share.canObserve
var $$midway = share.$$midway
var $$skipArray = share.$$skipArray
$$skipArray.$innuendo = true

var modelAdaptor = share.modelAdaptor
var makeHashCode = avalon.makeHashCode

var $emit = dispatch.$emit
var $watch = dispatch.$watch

if (window.Proxy) {
    function adjustVm(vm, expr) {
        if (vm.$innuendo) {
            var toppath = expr.split(".")[0]
            return vm.$innuendo[toppath] || vm
        } else {
            return vm
        }
    }
    $watch.adjust = adjustVm


    function $fire(expr, a, b) {
        var list = this.$events[expr]
        $emit(list, this, expr, a, b)
    }

    function masterFactory(definition, heirloom, options) {

        var $skipArray = {}
        if (definition.$skipArray) {//收集所有不可监听属性
            $skipArray = avalon.oneObject(definition.$skipArray)
            delete definition.$skipArray
        }
        options = options || {}
        var hashcode = makeHashCode("$")
        options.id = options.id || hashcode
        options.hashcode = hashcode
        var keys = []
        for (var key in definition) {
            if ($$skipArray[key])
                continue
            keys.push(key)
            var val = definition[key]
            if (canObserve(key, val, $skipArray)) {
                definition[key] = masterFactory(val, heirloom, {
                    id: definition.$id + '.' + key
                })
            }
        }
        definition.$track = keys.sort().join(';;')
        var vm = new Proxy(definition, handlers)
        return makeObserver(vm, heirloom, {}, {}, options)
    }

    $$midway.masterFactory = masterFactory
    //old, definition
    function slaveFactory(before, after, heirloom) {
        for (var key in after) {
            if ($$skipArray[key])
                continue
            if (!before.hasOwnProperty(key)) {//如果before没有此属性,就添加
                var val = after[key]
                if (canObserve(key, val, {})) {//如果是对象或数组
                    before[key] = masterFactory(val, heirloom, {
                        id: before.$id + '.' + key
                    })
                }
            }
        }
        if (key in before) {
            if (after.hasOwnProperty(key)) {
                delete before[key]
            }
        }
        before.$track = Object.keys(after).sort().join(';;')

        return before
    }

    $$midway.slaveFactory = slaveFactory

    function mediatorFactory(before, after, heirloom) {
        var $innuendo = {}
        var afterIsProxy = after.$id && after.$events
        var $skipArray = {}
        var definition = {}
        heirloom = heirloom || {}
        for (var key in before) {
            definition[key] = before[key]
            $innuendo[key] = before
        }
        for (var key in after) {
            if ($$skipArray[key])
                continue
            var val = definition[key] = after[key]
            if (canObserve(key, val, $skipArray)) {
                definition[key] = masterFactory(val, heirloom, {
                    id: definition.$id + '.' + key
                })
            }
            $innuendo[key] = after
        }
        definition.$track = Object.keys(definition).sort().join(';;')
        //  definition.hasOwnProperty = hasOwn

        var vm = new Proxy(definition, handlers)
        // heirloom.__vmodel__ = vm
        if (!afterIsProxy) {
            for (var i in $innuendo) {
                if ($innuendo[i] === after) {
                    $innuendo[i] = vm
                }
            }
        }

        vm.$innuendo = $innuendo

        return makeObserver(vm, heirloom, {}, {}, {
            id: before.$id,
            hashcode: makeHashCode("$")
        })
    }

    avalon.mediatorFactory = $$midway.masterFactory = mediatorFactory


    function makeObserver($vmodel, heirloom, discard , abandon, options) {

        if (options.array) {
            Object.defineProperty($vmodel, '$model', {
                get: function () {
                    return toJson(this)
                },
                set: avalon.noop,
                enumerable: false,
                configurable: true
            })
        }
        $vmodel.hasOwnProperty = hasOwn
        $vmodel.$id = options.id
        $vmodel.$hashcode = options.hashcode
        $vmodel.$events = heirloom
        if (options.master === true) {
            $vmodel.$element = null
            $vmodel.$render = 1
            $vmodel.$fire = $fire
            $vmodel.$watch = $watch
            heirloom.__vmodel__ = $vmodel
        }
        return $vmodel
    }

    $$midway.makeObserver = makeObserver

    var __array__ = share.__array__
    var ap = Array.prototype
    var _splice = ap.splice
    function notifySize(array, size) {
        if (array.length !== size) {
            array.notify('length', array.length, size, true)
        }
    }

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

                    args[j + 2] = modelAdaptor(neo[j], item, item && item.$events, {
                        id: this.$id + '.*',
                        master: true
                    })
                }

            } else {
                for (var i = 0, n = arguments.length; i < n; i++) {
                    args[i] = modelAdaptor(arguments[i], 0, {}, {
                        id: this.$id + '.*',
                        master: true
                    })
                }
            }
            var result = original.apply(this, args)

            notifySize(this, size)
            this.notify()
            return result
        }
    })

    'sort,reverse'.replace(avalon.rword, function (method) {
        __array__[method] = function () {
            ap[method].apply(this, arguments)

            this.notify()
            return this
        }
    })
}



function toJson(val) {
    var xtype = avalon.type(val)
    if (xtype === 'array') {
        var array = []
        for (var i = 0; i < val.length; i++) {
            array[i] = toJson(val[i])
        }
        return array
    } else if (xtype === 'object') {
        var obj = {}
        val.$track.split('??').forEach(function (i) {
            var value = val[i]
            obj[i] = value && value.nodeType ? value : toJson(value)
        })
        return obj
    }
    return val
}


var handlers = {
    deleteProperty: function (target, name) {
        if (target.hasOwnProperty(name)) {
            target.$track = (';;' + target.$track + ';;').
                    replace(';;' + name + ';;', '').slice(2, -2)
        }
    },
    get: function (target, name) {
        if (name === '$model') {
            return toJson(target)
        }
        return target[name]
    },
    set: function (target, name, value) {
        if (name === '$model') {
            return
        }
        var oldValue = target[name]
        if (oldValue !== value) {
            //如果是新属性
            if (!$$skipArray[name] && oldValue === void 0 && !target.hasOwnProperty(name)) {
                var arr = target.$track.split(';;')
                arr.push(name)
                target.$track = arr.sort().join(';;')
            }
            target[name] = value
            if (!$$skipArray[name]) {
                var curVm = target.$events.__vmodel__
                //触发视图变更
                var arr = target.$id.split('.')
                var top = arr.shift()

                var path = arr.length ? arr.join('.') + '.' + name : name
                var vm = adjustVm(curVm, path)
                var list = vm.$events[path]
                if (list && list.length) {
                    $emit(list, vm, path, value, oldValue)
                }

                avalon.rerenderStart = new Date
                avalon.batch(top, true)
            }
        }

    },
    has: function (target, name) {
        return target.hasOwnProperty(name)
    }
}


function hasOwn(name) {
    return (';;' + this.$track + ';;').indexOf(';;' + name + ';;') > -1
}

module.exports = avalon