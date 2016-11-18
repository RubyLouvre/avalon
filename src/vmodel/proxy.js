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
    Depend
} from './depend'
import {
    IProxy,
    collectDeps,
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
        proxy.$track = ''
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
        return 'Ȣ' + str + 'Ȣ'
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
            var selfDep = target.$accessors[name]
            var childObj = target[name]
            if (selfDep) {
                collectDeps(selfDep, childObj)
            }
            return selfDep ? selfDep.value : childObj
        },
        set: function(target, name, value) {
            if (name === '$model') {
                return true
            }
            var ac = target.$accessors

            var oldValue = target[name]
            if (oldValue !== value) {
                if (canHijack(name, value, target.$proxyItemBackdoor)) {
                    var ac = target.$accessors
                        //如果是新属性
                    if (!(name in $$skipArray) && !ac[name]) {
                        updateTrack(target, ac, name)
                    }
                    var selfDep = ac[name]
                    selfDep && selfDep.beforeNotify()
                        //创建子对象
                    var hash = oldValue && oldValue.$hashcode
                    var childObj = createProxy(value, selfDep)
                    if (childObj) {
                        childObj.$hashcode = hash
                        value = childObj
                    }
                    target[name] = selfDep.value = value //必须修改才notify
                    selfDep.notify()
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

    function updateTrack(target, ac, name) {
        var arr = target.$track.split('Ȣ')
        if (arr[0] === '') {
            arr.shift()
        }
        arr.push(name)
        ac[name] = new Depend(name)
        target.$track = arr.sort().join('Ȣ')
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