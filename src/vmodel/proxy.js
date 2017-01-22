import {
    avalon,
    platform,
    isObject,
    modern
} from '../seed/core'
import {
    $$skipArray
} from './reserved'
import {
    Mutation
} from './Mutation'
import {
    Computed
} from './Computed'
import {
    IProxy,
    canHijack,
    createProxy
} from './share'

if (typeof Proxy === 'function') {
    avalon.config.inProxyMode = true

    platform.modelFactory = function modelFactory(definition, dd) {
        var clone = {}
        for (let i in definition) {
            clone[i] = definition[i]
            delete definition[i]
        }

        definition.$id = clone.$id
        var proxy = new IProxy(definition, dd)

        var vm = toProxy(proxy)
            //先添加普通属性与监控属性
        for (let i in clone) {
            vm[i] = clone[i]
        }
        vm.hasOwnProperty = function(a) {
            return wrapIt(this.$track).indexOf(wrapIt(a)) !== -1
        }
        var $computed = clone.$computed
            //再添加计算属性
        if ($computed) {
            delete clone.$computed
            for (let i in $computed) {
                let val = $computed[i]
                if (typeof val === 'function') {
                    let _val = val
                    val = { get: _val }
                }
                if (val && val.get) {
                    val.getter = val.get
                        //在set方法中的target是IProxy，需要重写成Proxy，才能依赖收集
                    val.vm = vm
                    if (val.set)
                        val.setter = val.set
                    $computed[i] = val
                    delete clone[i] //去掉重名的监控属性
                } else {
                    delete $computed[i]
                }
            }

            for (let i in $computed) {
                vm[i] = $computed[i]
            }
        }


        return vm
    }

    //https://developer.mozilla.org/en-US/docs/Archive/Web/Old_Proxy_API
    function toProxy(definition) {
        return Proxy.create ? Proxy.create(definition, traps) :
            new Proxy(definition, traps)
    }

    function wrapIt(str) {
        return '☥' + str + '☥'
    }
    var traps = {
        deleteProperty(target, name) {
            if (target.hasOwnProperty(name)) {
                //移除一个属性,分三昌:
                //1. 移除监听器
                //2. 移除真实对象的对应属性
                //3. 移除$track中的键名
                delete target.$accessors[name]
                delete target[name]
                target.$track = wrapIt(target.$track).replace(wrapIt(name), '').slice(1, -1)
            }
            return true
        },
        get(target, name) {
            if (name === '$model') {
                return platform.toJson(target)
            }
            //收集依赖
            var m = target.$accessors[name]
            if (m && m.get) {
                return m.get()
            }

            return target[name]
        },
        set(target, name, value) {

            if (name === '$model') {
                return true
            }
            if (name === '$computed' || 'hasOwnProperty' === name) {
                target[name] = value
                return true
            }

            var oldValue = target[name]
            if (oldValue !== value) {
                if (canHijack(name, value, target.$proxyItemBackdoor)) {
                    var mutations = target.$accessors
                    var $computed = target.$computed || {}
                        //如果是新属性
                    if (!(name in $$skipArray) && !mutations[name]) {
                        updateTrack(target, name, value, !!$computed[name])
                            //   var a = mutations[name].get()
                        return true
                    }
                    var mutation = mutations[name]
                        //创建子对象

                    mutation.set(value)
                    target[name] = mutation.value
                } else {
                    target[name] = value
                }
            }
            // set方法必须返回true, 告诉Proxy已经成功修改了这个值,否则会抛
            //'set' on proxy: trap returned falsish for property xxx 错误
            return true
        },
        has(target, name) {
            return target.hasOwnProperty(name)
        }
    }

    function updateTrack(target, name, value, isComputed) {
        var arr = target.$track.match(/[^☥]+/g) || []
        arr.push(name)
        var Observable = isComputed ? Computed : Mutation
        target.$accessors[name] = new Observable(name, value, target)
        target.$track = arr.sort().join('☥')
    }
    //    platform.itemFactory = function itemFactory(before, after) {
    //        var definition = before.$model
    //        definition.$proxyItemBackdoor = true
    //        definition.$id = before.$hashcode +
    //            String(after.hashcode || Math.random()).slice(6)
    //        definition.$accessors = avalon.mix({}, before.$accessors)
    //        var vm = platform.modelFactory(definition)
    //        for (var i in after.data) {
    //            vm[i] = after.data[i]
    //        }
    //        return vm
    //    }

    platform.fuseFactory = function fuseFactory(before, after) {
        var definition = avalon.mix(before.$model, after.$model)
        definition.$id = before.$hashcode + after.$hashcode
        definition.$hooks = avalon.mix({}, before.$hooks, after.$hooks)
        definition.$accessors = avalon.mix({},
            before.$accessors,
            after.$accessors)
        return platform.modelFactory(definition)
    }
}