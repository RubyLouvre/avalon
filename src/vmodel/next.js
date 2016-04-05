var $$skipArray = require('./parts/skipArray')
var dispatch = require('./proxy/dispatch')
var $emit = dispatch.$emit
var $watch = dispatch.$watch

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
            if (oldValue === void 0 && !target.hasOwnProperty(name)) {
                var arr = target.$track.split(';;')
                arr.push(name)
                target.$track = arr.sort().join(';;')
            }
            target[name] = value
            if (!$$skipArray[name]) {
                var heirloom = target.$events
                var vm = heirloom.__vmodel__
                if (vm && heirloom !== vm.$events) {
                    target.$events = vm.$events
                }
                //触发视图变更
                var arr = target.$id.split('.')
                arr.shift()
                var path = arr.length ? arr.join('.') + '.' + name : name
                var list = target.$events[path]
                if (list && list.length) {
                    $emit(list, vm, path, value, oldValue)
                }
                var vid = vm.$id.split('.')[0]
                avalon.rerenderStart = new Date
                avalon.batch(vid, true)
                //console.log('valueChange', name)
            }
        }

    },
    has: function (target, name) {
        return target.hasOwnProperty(name)
    }

}
$$skipArray.$map = true
function mediatorFactory(before, after, heirloom) {

    var $map = {}
    var isProxy = after instanceof Proxy
    var $skipArray = {}
    var definition = {}
    heirloom = heirloom || {}
    for (var key in before) {
        definition[key] = before[key]
        $map[key] = before
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
        $map[key] = after
    }
    definition.$track = Object.keys(definition).sort().join(';;')
    definition.hasOwnProperty = hasOwn
    
    var $vmodel = new Proxy(definition, handlers)
    if (isProxy) {
        heirloom.__vmodel__ = after
    } else {
        heirloom.__vmodel__ = $vmodel
        for (var i in $map) {
            if ($map[i] === after) {
                $map[i] = $vmodel
            }
        }
    }
    
    $vmodel.$map = $map
    $vmodel.$events = heirloom
    $vmodel.$fire = $fire
    $vmodel.$watch = $watch
    $vmodel.$id = before.$id
    $vmodel.$hashcode = makeHashCode("$")

    return $vmodel
}

avalon.mediatorFactory = mediatorFactory