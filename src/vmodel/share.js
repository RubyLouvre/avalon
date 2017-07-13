import { avalon, platform, isObject, modern } from '../seed/core'
import { $$skipArray } from './reserved'
import { Mutation } from './Mutation'
import { Computed } from './Computed'


/**
 * 这里放置ViewModel模块的共用方法
 * avalon.define: 全框架最重要的方法,生成用户VM
 * IProxy, 基本用户数据产生的一个数据对象,基于$model与vmodel之间的形态
 * modelFactory: 生成用户VM
 * canHijack: 判定此属性是否该被劫持,加入数据监听与分发的的逻辑
 * createProxy: listFactory与modelFactory的封装
 * createAccessor: 实现数据监听与分发的重要对象
 * itemFactory: ms-for循环中产生的代理VM的生成工厂
 * fuseFactory: 两个ms-controller间产生的代理VM的生成工厂
 */


avalon.define = function(definition) {
    var $id = definition.$id
    if (!$id) {
        avalon.error('vm.$id must be specified')
    }
    if (avalon.vmodels[$id]) {
        avalon.warn('error:[' + $id + '] had defined!')
    }
    var vm = platform.modelFactory(definition)
    return avalon.vmodels[$id] = vm
}

/**
 * 在未来的版本,avalon改用Proxy来创建VM,因此
 */

export function IProxy(definition, dd) {
    avalon.mix(this, definition)
    avalon.mix(this, $$skipArray)
    this.$hashcode = avalon.makeHashCode('$')
    this.$id = this.$id || this.$hashcode
    this.$events = {
        __dep__: dd || new Mutation(this.$id)
    }
    if (avalon.config.inProxyMode) {
        delete this.$mutations
        this.$accessors = {}
        this.$computed = {}
        this.$track = ''
    } else {
        this.$accessors = {
            $model: modelAccessor
        }
    }
    if (dd === void 0) {
        this.$watch = platform.watchFactory()
        this.$fire = platform.fireFactory()
    } else {
        delete this.$watch
        delete this.$fire
    }
}

platform.modelFactory = function modelFactory(definition, dd) {
    var $computed = definition.$computed || {}
    delete definition.$computed
    var core = new IProxy(definition, dd)
    var $accessors = core.$accessors
    var keys = []

    platform.hideProperty(core, '$mutations', {})

    for (let key in definition) {
        if (key in $$skipArray)
            continue
        var val = definition[key]
        keys.push(key)
        if (canHijack(key, val)) {
            $accessors[key] = createAccessor(key, val)
        }
    }
    for (let key in $computed) {
        if (key in $$skipArray)
            continue
        var val = $computed[key]
        if (typeof val === 'function') {
            val = {
                get: val
            }
        }
        if (val && val.get) {
            val.getter = val.get
            val.setter = val.set
            avalon.Array.ensure(keys, key)
            $accessors[key] = createAccessor(key, val, true)
        }
    }
    //将系统API以unenumerable形式加入vm,
    //添加用户的其他不可监听属性或方法
    //重写$track
    //并在IE6-8中增添加不存在的hasOwnPropert方法
    var vm = platform.createViewModel(core, $accessors, core)
    platform.afterCreate(vm, core, keys, !dd)
    return vm
}
var $proxyItemBackdoorMap = {}

export function canHijack(key, val, $proxyItemBackdoor) {
    if (key in $$skipArray)
        return false
    if (key.charAt(0) === '$') {
        if ($proxyItemBackdoor) {
            if (!$proxyItemBackdoorMap[key]) {
                $proxyItemBackdoorMap[key] = 1
                avalon.warn(`ms-for中的变量${key}不再建议以$为前缀`)
            }
            return true
        }
        return false
    }
    if (val == null) {
        avalon.warn('定义vmodel时' + key + '的属性值不能为null undefine')
        return true
    }
    if (/error|date|function|regexp/.test(avalon.type(val))) {
        return false
    }
    return !(val && val.nodeName && val.nodeType)
}

export function createProxy(target, dd) {
    if (target && target.$events) {
        return target
    }
    var vm
    if (Array.isArray(target)) {
        vm = platform.listFactory(target, false, dd)
    } else if (isObject(target)) {
        vm = platform.modelFactory(target, dd)
    }
    return vm
}

platform.createProxy = createProxy

platform.itemFactory = function itemFactory(before, after) {
    var keyMap = before.$model
    var core = new IProxy(keyMap)
    var state = avalon.shadowCopy(core.$accessors, before.$accessors) //防止互相污染
    var data = after.data
        //core是包含系统属性的对象
        //keyMap是不包含系统属性的对象, keys
    for (var key in data) {
        var val = keyMap[key] = core[key] = data[key]
        state[key] = createAccessor(key, val)
    }
    var keys = Object.keys(keyMap)
    var vm = platform.createViewModel(core, state, core)
    platform.afterCreate(vm, core, keys)
    return vm
}

function createAccessor(key, val, isComputed) {
    var mutation = null
    var Accessor = isComputed ? Computed : Mutation
    return {
        get: function Getter() {
            if (!mutation) {
                mutation = new Accessor(key, val, this)
            }
            return mutation.get()
        },
        set: function Setter(newValue) {
            if (!mutation) {
                mutation = new Accessor(key, val, this)
            }
            mutation.set(newValue)
        },
        enumerable: true,
        configurable: true
    }
}


platform.fuseFactory = function fuseFactory(before, after) {
    var keyMap = avalon.mix(before.$model, after.$model)
    var core = new IProxy(avalon.mix(keyMap, {
        $id: before.$id + after.$id
    }))
    var state = avalon.mix(core.$accessors,
            before.$accessors, after.$accessors) //防止互相污染

    var keys = Object.keys(keyMap)
        //将系统API以unenumerable形式加入vm,并在IE6-8中添加hasOwnPropert方法
    var vm = platform.createViewModel(core, state, core)
    platform.afterCreate(vm, core, keys, false)
    return vm
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
        if (typeof val.$track === 'string') {
            var obj = {}
            var arr = val.$track.match(/[^☥]+/g) || []
            arr.forEach(function(i) {
                var value = val[i]
                obj[i] = value && value.$events ? toJson(value) : value
            })
            return obj
        }
    }
    return val
}

var modelAccessor = {
    get: function() {
        return toJson(this)
    },
    set: avalon.noop,
    enumerable: false,
    configurable: true
}

platform.toJson = toJson
platform.modelAccessor = modelAccessor
