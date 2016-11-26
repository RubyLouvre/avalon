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
    IProxy,
    canHijack,
    createProxy
} from './share'

if (typeof Proxy === 'function') {
    avalon.config.inProxyMode = true

    platform.modelFactory = function modelFactory(definition, dd) {
        var clone = {}
        for (var i in definition) {
            clone[i] = definition[i]
            delete definition[i]
        }
        definition.$id = clone.$id
        var proxy = new IProxy(definition, dd)

        var vm = toProxy(proxy)
        for (var i in clone) {
            vm[i] = clone[i]
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
        deleteProperty: function(target, name) {
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
        get: function(target, name) {
            if (name === '$model') {
                return platform.toJson(target)
            }
            //收集依赖
            var mutation = target.$accessors[name]
            var childObj = target[name]
            if (mutation) {
                //  collectDeps(selfDep, childObj)
            }
            return mutation ? mutation.get() : childObj
        },
        set: function(target, name, value) {
            if (name === '$model') {
                return true
            }
            if (name === '$computed') {
                setComputed(target, name, value)
                return true
            }


            var oldValue = target[name]
            if (oldValue !== value) {
                if (canHijack(name, value, target.$proxyItemBackdoor)) {
                    var mutations = target.$accessors
                        //如果是新属性
                    if (!(name in $$skipArray) && !mutations[name]) {
                        updateTrack(target, name, value, mutations)
                    }
                    var mutation = mutations[name]
                        //创建子对象
                    var hash = oldValue && oldValue.$hashcode
                    var childObj = createProxy(value, mutation)
                    if (childObj) {
                        childObj.$hashcode = hash
                        value = childObj
                    }
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
        has: function(target, name) {
            return target.hasOwnProperty(name)
        }
    }

    function setComputed() {

    }

    function updateTrack(target, name, value, mutations) {
        var arr = target.$track.split('☥')
        if (arr[0] === '') {
            arr.shift()
        }
        arr.push(name)
        mutations[name] = new Mutation(name, value, target)
        target.$track = arr.sort().join('☥')
    }
    platform.itemFactory = function itemFactory(before, after) {
        var definition = before.$model
        definition.$proxyItemBackdoor = true
        definition.$id = before.$hashcode +
            String(after.hashcode || Math.random()).slice(6)
        definition.$accessors = avalon.mix({}, before.$accessors)
        var vm = platform.modelFactory(definition)
        for (var i in after.data) {
            vm[i] = after.data[i]
        }
        return vm
    }

    platform.fuseFactory = function fuseFactory(before, after) {
        var definition = avalon.mix(before.$model, after.$model)
        definition.$id = before.$hashcode + after.$hashcode
        definition.$accessors = avalon.mix({},
            before.$accessors,
            after.$accessors)
        return platform.modelFactory(definition)
    }
}