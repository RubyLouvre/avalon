import {warlords} from './warlords'
import {$$skipArray} from './skipArray'
import {$emit, $watch} from './dispatch'
import __array__ from './__array__'



var rskip = /function|window|date|regexp|element/i
/**
 * 判定此属性是否能转换为访问器属性
 * 不能以$开头， 不位于skipArray数组内，
 * 类型不能为函数，window, date, regexp, 元素
 * ？？？
 * 
 * 以后将反向操作 ，要求类型只能是array, object, undefined, null, boolean, number, string
 */
export function isSkip(key, value, skipArray) {
    // 判定此属性能否转换访问器
    return key.charAt(0) === '$' ||
            skipArray[key] ||
            (rskip.test(avalon.type(value))) ||
            (value && value.nodeName && value.nodeType > 0)
}


/**
 * 将属性值再进行转换
 */
export function modelAdaptor(definition, old, heirloom, options) {
    var type = avalon.type(definition)
    switch(type){
        case 'array':
           return warlords.arrayFactory(definition, old, heirloom, options)
        case 'object':
           if (old && old.$id) {
                ++avalon.suspendUpdate
                //1.5带来的优化方案
                if (old.$track !== Object.keys(definition).sort().join(';;')) {
                    var vm = warlords.slaveFactory(old, definition, heirloom, options)
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
                vm = warlords.masterFactory(definition, heirloom, options)
                return vm
            }
         default:
          return definition
    }
}

warlords.modelAdaptor = modelAdaptor

/**
 * 生成访问器属性的定义对象
 * 依赖于
 * $emit
 * modelAdaptor
 * emitWidget
 * emitArray
 * emitWildcard
 * batchUpdateView
 * 
 */
export function makeAccessor(sid, spath, heirloom) {
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
            var vm = heirloom.__vmodel__
            if (val && typeof val === 'object') {
                val = modelAdaptor(val, old, heirloom, {
                    pathname: spath,
                    id: sid
                })
            }
            var older = old
            old = val
            if (this.$hashcode && vm ) {
                vm.$events.$$dirty$$ = true
                if(vm.$events.$$wait$$)
                    return
                //★★确保切换到新的events中(这个events可能是来自oldProxy)               
                if (heirloom !== vm.$events) {
                    get.heirloom = vm.$events
                }
               
                //如果这个属性是组件配置对象中的属性,那么它需要触发组件的回调
                emitWidget(get.$decompose, spath, val, older)
                //触发普通属性的回调
                if (spath.indexOf('*') === -1) {
                    $emit(get.heirloom[spath], vm, spath, val, older)
                }
                //如果这个属性是数组元素上的属性
                emitArray(sid+'', vm, spath, val, older)
                //如果这个属性存在通配符
                emitWildcard(get.heirloom, vm, spath, val, older)
                vm.$events.$$dirty$$ = false
                batchUpdateView(vm.$id)
            }
        },
        enumerable: true,
        configurable: true
    }
}

export function batchUpdateView(id) {
    avalon.rerenderStart = new Date
    var dotIndex = id.indexOf('.')
    if (dotIndex > 0) {
        avalon.batch(id.slice(0, dotIndex))
    } else {
        avalon.batch(id)
    }
}


avalon.define = function (definition) {
    var $id = definition.$id
    if (!$id) {
        avalon.warn('vm.$id must be specified')
    }
    if (avalon.vmodels[$id]) {
        throw Error('error:[' + $id + '] had defined!')
    }
    var vm = warlords.masterFactory(definition, {}, {
        pathname: '',
        id: $id,
        master: true
    })
    return avalon.vmodels[$id] = vm
}


export function arrayFactory(array, old, heirloom, options) {
    if (old && old.splice) {
        var args = [0, old.length].concat(array)
        ++avalon.suspendUpdate
        avalon.callArray =  options.pathname
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
                if (!d && !heirloom.$$wait$$ && !avalon.suspendUpdate ) {
                    avalon.callArray = path
                    batchUpdateView(vm.$id)
                    delete avalon.callArray 
                }
            }
        }

        var hashcode = avalon.makeHashCode('$')
        options.array = true
        options.hashcode = hashcode
        options.id = options.id || hashcode
        warlords.initViewModel(array, heirloom, {}, {}, options)

        for (var j = 0, n = array.length; j < n; j++) {
            array[j] = modelAdaptor(array[j], 0, {}, {
                id: array.$id + '.*',
                master: true
            })
        }
        return array
    }
}

warlords.arrayFactory = arrayFactory

//======inner start
var rtopsub = /([^.]+)\.(.+)/
function emitArray(sid, vm, spath, val, older) {
    if (sid.indexOf('.*.') > 0) {
        var arr = sid.match(rtopsub)
        var top = avalon.vmodels[ arr[1] ]
        if (top) {
            var path = arr[2]
            $emit(top.$events[ path ], vm, spath, val, older)
        }
    }
}

function emitWidget(whole, spath, val, older) {
    if (whole && whole[spath]) {
        var wvm = whole[spath]
        if (!wvm.$hashcode) {
            delete whole[spath]
        } else {
            var wpath = spath.replace(/^[^.]+\./, '')
            if (wpath !== spath) {
                $emit(wvm.$events[wpath], wvm, wpath, val, older)
            }
        }
    }
}

function emitWildcard(obj, vm, spath, val, older) {
    if (obj.__fuzzy__) {
        obj.__fuzzy__.replace(avalon.rword, function (expr) {
            var list = obj[expr]
            var reg = list.reg
            if (reg && reg.test(spath)) {
                $emit(list, vm, spath, val, older)
            }
            return expr
        })
    }
}

//======inner end