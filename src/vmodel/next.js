var $$skipArray = require('./parts/skipArray')
var dispatch = require('./proxy/dispatch')
var $emit = dispatch.$emit
var $watch = dispatch.$watch
var adjustVm = dispatch.adjustVm

function $fire(expr, a, b) {
    var list = this.$events[expr]
    $emit(list, this, expr, a, b)
}

function canProxy(key, value, skipArray) {
    // 判定此属性能否转换访问器
    return  !skipArray[key] &&
            (key.charAt(0) !== '$') &&
            (avalon.isPlainObject(value) || Array.isArray(value)) &&
            !value.$id
}


function masterFactory(definition, heirloom, options) {

    var $skipArray = {}
    if (definition.$skipArray) {//收集所有不可监听属性
        $skipArray = avalon.oneObject(definition.$skipArray)
        delete definition.$skipArray
    }
    options = options || {}
    var hashcode = avalon.makeHashCode("$")
    definition.$id = options.id || hashcode
    definition.$hashcode = options.hashcode || hashcode
    var keys = []
    for (var key in definition) {
        if ($$skipArray[key])
            continue
        keys.push(key)
        var val = definition[key]
        if (canProxy(key, val, $skipArray)) {
            definition[key] = masterFactory(val, heirloom, {
                id: definition.$id + '.' + key
            })
        }
    }
    definition.$events = heirloom

    if (options.master) {
        definition.$fire = $fire
        definition.$watch = $watch
    }

    definition.$track = keys.sort().join(';;')
    definition.hasOwnProperty = hasOwn
    var vm = new Proxy(definition, handlers)
    if (options.master) {
        heirloom.__vmodel__ = vm
    }
    return vm
}

function hasOwn(name) {
    return (';;' + this.$track + ';;').indexOf(';;' + name + ';;') > -1
}
function define(definition) {
    var $id = definition.$id
    if (!$id && avalon.config.debug) {
        avalon.warn('vm.$id must be specified')
    }
    var vm = masterFactory(definition, {}, {
        pathname: '',
        id: $id,
        master: true
    })

    if (avalon.vmodels[$id]) {
        throw Error('error:[', $id, '] had defined!')
    }
    return avalon.vmodels[$id] = vm

}

avalon.define = define

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
$$skipArray.$innuendo = true

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
        if (canProxy(key, val, $skipArray)) {
            definition[key] = masterFactory(val, heirloom, {
                id: definition.$id + '.' + key
            })
        }
        $innuendo[key] = after
    }
    definition.$track = Object.keys(definition).sort().join(';;')
    definition.hasOwnProperty = hasOwn

    var vm = new Proxy(definition, handlers)
    heirloom.__vmodel__ = vm
    if (!afterIsProxy) {
        for (var i in $innuendo) {
            if ($innuendo[i] === after) {
                $innuendo[i] = vm
            }
        }
    }

    vm.$innuendo = $innuendo
    vm.$events = heirloom
    vm.$fire = $fire
    vm.$watch = $watch
    vm.$id = before.$id
    vm.$hashcode = avalon.makeHashCode("$")

    return vm
}

avalon.mediatorFactory = mediatorFactory