
var dispatch = require('../../strategy/dispatch')
var $watch = dispatch.$watch
var $emit = dispatch.$emit
var $$midway = {}
var $$skipArray = require('./skipArray')

function makeObserver($vmodel, options, heirloom, keys, accessors) {
    function hasOwnKey(key) {
        return keys[key] === true
    }
    var hide = $$midway.hideProperty
    hide($vmodel, '$id', options.id)
    hide($vmodel, '$accessors', accessors)
    hide($vmodel, 'hasOwnProperty', hasOwnKey)
    hide($vmodel, '$hashcode', options.hashcode)
    if (options.master === true) {
        makeFire($vmodel, heirloom)
    }
}

function makeFire($vmodel, heirloom) {
    heirloom.__vmodel__ = $vmodel
    var hide = $$midway.hideProperty

    hide($vmodel, '$events', heirloom)
    hide($vmodel, '$watch', function () {
        if (arguments.length === 2) {
            return $watch.apply($vmodel, arguments)
        } else {
            throw '$watch方法参数不对'
        }
    })
    hide($vmodel, '$fire', function (expr, a, b) {
        var list = $vmodel.$events[expr]
        $emit(list, $vmodel, expr, a, b)
    })
}

function isSkip(key, value, skipArray) {
    // 判定此属性能否转换访问器
    return key.charAt(0) === '$' ||
            skipArray[key] ||
            (typeof value === 'function') ||
            (value && value.nodeName && value.nodeType > 0)
}


function modelAdaptor(definition, old, heirloom, options) {
    //如果数组转换为监控数组
    if (Array.isArray(definition)) {
        return $$midway.arrayFactory(definition, old, heirloom, options)
    } else if (avalon.isPlainObject(definition)) {
        //如果此属性原来就是一个VM,拆分里面的访问器属性
        if (Object(old) === old) {
            var vm = $$midway.slaveFactory(old, definition, heirloom, options)
            for (var i in definition) {
                if ($$skipArray[i])
                    continue
                vm[i] = definition[i]
            }
            return vm
        } else {
            vm = $$midway.masterFactory(definition, heirloom, options)
            return vm
        }
    } else {
        return definition
    }
}

var rtopsub = /([^.]+)\.(.+)/
function makeAccessor(sid, spath, heirloom) {
    var old = NaN
    function get() {
        return old
    }
    get.heirloom = heirloom
    return {
        get: get,
        set: function (val) {
            if (old === val) {
                return
            }
            if (val && typeof val === 'object') {
                val = $$midway.modelAdaptor(val, old, heirloom, {
                    pathname: spath,
                    id: sid
                })
            }
            var older = old
            old = val
            var vm = heirloom.__vmodel__
            if (this.$hashcode && vm) {
                //★★确保切换到新的events中(这个events可能是来自oldProxy)               
                if (vm && heirloom !== vm.$events) {
                    get.heirloom = vm.$events
                }
                $emit(get.heirloom[spath], vm, spath, val, older)
                if (sid.indexOf('.*.') > 0) {//如果是item vm
                    var arr = sid.match(rtopsub)
                    var top = avalon.vmodels[ arr[1] ]
                    if (top) {
                        var path = arr[2]
                        $emit(top.$events[ path ], vm, path, val, older)
                    }
                }
                var vid = vm.$id.split('.')[0]
                avalon.rerenderStart = new Date
                avalon.batch(vid, true)
            }
        },
        enumerable: true,
        configurable: true
    }
}


function define(definition) {
    var $id = definition.$id
    if (!$id) {
        avalon.log('warning: vm.$id must be specified')
    }
    var vm = $$midway.masterFactory(definition, {}, {
        pathname: '',
        id: $id,
        master: true
    })

    if (avalon.vmodels[$id]) {
        throw Error('warning:[', $id, '] had defined!')
    }
    avalon.vmodels[$id] = vm

    avalon.ready(function () {
        var elem = document.getElementById($id)
        if (!elem)
            return
        vm.$element = elem
        var now = new Date - 0
        var vnode = avalon.lexer(elem.outerHTML)
        avalon.log('create primitive vtree', new Date - now)
        now = new Date
        vm.$render = avalon.render(vnode)
        avalon.log('create template Function ', new Date - now)
        avalon.rerenderStart = new Date
        elem.vnode = vnode
        avalon.batch($id)

    })

    return vm
}

avalon.define = define

module.exports = {
    $emit: $emit,
    $watch: $watch,
    $$midway: $$midway,
    $$skipArray: $$skipArray,
    isSkip: isSkip,
    makeFire: makeFire,
    makeObserver: makeObserver,
    makeAccessor: makeAccessor,
    modelAdaptor: modelAdaptor
}