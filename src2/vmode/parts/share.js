

var $$midway = {}
var $$skipArray = require('./skipArray')
var dispatch = require('./dispatch')
var $emit = dispatch.$emit
var $watch = dispatch.$watch


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
    } else if (Object(definition) === definition && typeof definition !== 'function') {
        //如果此属性原来就是一个VM,拆分里面的访问器属性
        if (old && old.$id) {
            ++avalon.suspendUpdate
            //1.5带来的优化方案
            if (old.$track !== Object.keys(definition).sort().join(';;')) {
                var vm = $$midway.slaveFactory(old, definition, heirloom, options)
            } else {
                vm = old
            }
            for (var i in definition) {
                if ($$skipArray[i])
                    continue
                vm[i] = definition[i]
            }
            --avalon.suspendUpdate
            return vm
        } else {
            vm = $$midway.masterFactory(definition, heirloom, options)
            return vm
        }
    } else {
        return definition
    }
}
$$midway.modelAdaptor = modelAdaptor

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
                if (heirloom !== vm.$events) {
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
               
                avalon.rerenderStart = new Date
                var dotIndex = vm.$id.indexOf('.')
                if(dotIndex > 0){
                    avalon.batch(vm.$id.slice(0, dotIndex), true)
                }else{
                    avalon.batch(vm, true)
                }
              
            }
        },
        enumerable: true,
        configurable: true
    }
}


function define(definition) {
    var $id = definition.$id
    if (!$id && avalon.config.debug) {
        avalon.warn('vm.$id must be specified')
    }
    if (avalon.vmodels[$id]) {
        throw Error('error:[', $id, '] had defined!')
    }
    var vm = $$midway.masterFactory(definition, {}, {
        pathname: '',
        id: $id,
        master: true
    })

    return avalon.vmodels[$id] = vm

}

function arrayFactory(array, old, heirloom, options) {
    if (old && old.splice) {
        var args = [0, old.length].concat(array)
        ++avalon.suspendUpdate 
        old.splice.apply(old, args)
        --avalon.suspendUpdate 
        return old
    } else {
        for (var i in __array__) {
            array[i] = __array__[i]
        }

        array.notify = function (a, b, c, d) {
            var vm = heirloom.__vmodel__
            if (vm) {
                var path = a === null || a === void 0 ?
                        options.pathname :
                        options.pathname + '.' + a
                vm.$fire(path, b, c)
                if (!d && !avalon.suspendUpdate) {
                    avalon.rerenderStart = new Date
                    avalon.batch(vm, true)
                }
            }
        }

        var hashcode = avalon.makeHashCode('$')
        options.array = true
        options.hashcode = hashcode
        options.id = options.id || hashcode
        $$midway.makeObserver(array, heirloom, {}, {}, options)

        for (var j = 0, n = array.length; j < n; j++) {
            array[j] = modelAdaptor(array[j], 0, {}, {
                id: array.$id + '.*',
                master: true
            })
        }
        return array
    }
}
$$midway.arrayFactory = arrayFactory

var __array__ = {
    set: function (index, val) {
        if (((index >>> 0) === index) && this[index] !== val) {
            if (index > this.length) {
                throw Error(index + 'set方法的第一个参数不能大于原数组长度')
            }
            this.notify('*', val, this[index], true)
            this.splice(index, 1, val)
        }
    },
    contains: function (el) { //判定是否包含
        return this.indexOf(el) !== -1
    },
    ensure: function (el) {
        if (!this.contains(el)) { //只有不存在才push
            this.push(el)
        }
        return this
    },
    pushArray: function (arr) {
        return this.push.apply(this, arr)
    },
    remove: function (el) { //移除第一个等于给定值的元素
        return this.removeAt(this.indexOf(el))
    },
    removeAt: function (index) { //移除指定索引上的元素
        if ((index >>> 0) === index) {
            return this.splice(index, 1)
        }
        return []
    },
    clear: function () {
        this.removeAll()
        return this
    }
}
avalon.define = define

module.exports = {
    $$midway: $$midway,
    $$skipArray: $$skipArray,
    isSkip: isSkip,
    __array__: __array__,
    makeFire: makeFire,
    makeAccessor: makeAccessor,
    modelAdaptor: modelAdaptor
}