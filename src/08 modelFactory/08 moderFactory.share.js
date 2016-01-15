//这里放置modelFactory新旧版都用到的方法

//所有vmodel都储存在这里
avalon.vmodels = {}
var vtree = {}
var dtree = {}
var rtopsub = /([^.]+)\.(.+)/
avalon.vtree = vtree

/**
 * avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个vm
 *  vm拥有如下私有属性
 
 $id: vm.id
 $events: 放置$watch回调与绑定对象
 $watch: 增强版$watch
 $fire: 触发$watch回调
 $hashcode:相当于uuid,但为false时会防止依赖收集,让框架来回收
 $model:返回一个纯净的JS对象
 $accessors: avalon.js独有的对象,放置所有访问器属性
 =============================
 $skipArray:用于指定不可监听的属性,但vm生成是没有此属性的
 
 $$skipArray与$skipArray都不能监控,
 不同点是
 $$skipArray被hasOwnProperty后返回false
 $skipArray被hasOwnProperty后返回true
 
 * 
 * @param {Object} definition 用户定义
 * @returns {Component} vm
 */
avalon.define = function (definition) {
    var $id = definition.$id
    if (!$id) {
        log("warning: vm必须指定$id")
    }
    var vmodel = observeObject(definition, {}, {
        pathname: "",
        idname: $id,
        top: true
    })

    avalon.vmodels[$id] = vmodel
    return vmodel
}



/**
 * observeArray及observeObject的包装函数
 * @param {type} definition
 * @param {type} old
 * @param {type} heirloom
 * @param {type} options
 * @returns {Component|Any}
 */
function observe(definition, old, heirloom, options) {
    //如果数组转换为监控数组
    if (Array.isArray(definition)) {
        return observeArray(definition, old, heirloom, options)
    } else if (avalon.isPlainObject(definition)) {
        //如果此属性原来就是一个VM,拆分里面的访问器属性
        if (Object(old) === old) {
            var vm = reuseFactory(old, definition, heirloom, options)

            for (var i in definition) {
                if ($$skipArray[i])
                    continue
                vm[i] = definition[i]
            }
            return vm
        } else {
            //否则新建一个VM
            vm = observeObject(definition, heirloom, options)
            return vm
        }
    } else {
        return definition
    }
}
//一个vm总是为Compoenent或SubComponent的实例
function Component() {
}

function SubComponent() {
}


/**
 * 生成普通访问器属性
 * 
 * @param {type} sid
 * @param {type} spath
 * @param {type} heirloom
 * @returns {PropertyDescriptor}
 */
function makeObservable(sid, spath, heirloom) {
    var old = NaN
    function get() {
        return old
    }
    get.list = []
    get.heirloom = heirloom
    return {
        get: get,
        set: function (val) {
            if (old === val) {
                return
            }
            if (val && typeof val === "object") {
                if (old && old.$id && val.$id) {//合并两个vm,比如proxy item中的el = newEl
                    for (var ii in val) {
                        old[ii] = val[ii]
                    }
                    console.log("这是新添加的分支", old, val)
                } else {
                    val = observe(val, old, heirloom, {
                        pathname: spath,
                        idname: sid
                    })
                }
            }

            var older = old
            old = val
            var vm = heirloom.__vmodel__
            if (this.$hashcode && vm) {

                //★★确保切换到新的events中(这个events可能是来自oldProxy)               
                if (heirloom !== vm.$events) {
                    get.heirloom = vm.$events
                    get.list = get.heirloom[spath]
                    // console.log(get.list, eventList, heirloom[spath], spath)
                }
                // console.log(spath, val, older, sid)
                $emit(get.list, this, spath, val, older)
                if (spath.indexOf(".*.") > 0) {//如果是item vm
                    var arr = vm.$id.match(rtopsub)
                    var top = avalon.vmodels[ arr[1] ]
                    if (top) {
                        $emit(top.$events[ arr[2] ], this, arr[2], val, older)
                    }
                }
                if (avalon.vtree[ vm.$id.split(".")[0] ]) {
                    batchUpdateEntity(vm.$id.split(".")[0])
                }

            }
        },
        enumerable: true,
        configurable: true
    }
}

/**
 * 生成计算访问器属性
 * 
 * @param {type} sid
 * @param {type} spath
 * @param {type} heirloom
 * @param {type} top
 * @param {type} key
 * @param {type} value
 * @returns {PropertyDescriptor}
 */

function makeComputed(sid, spath, heirloom, key, value) {
    var old = NaN
    function get() {
        return old = value.get.call(this)
    }
    get.heirloom = heirloom
    get.list = []
    return {
        get: get,
        set: function (x) {
            if (typeof value.set === "function") {
                var older = old
                value.set.call(this, x)
                var val = this[key]
                if (this.$hashcode && (val !== older)) {
                    var vm = heirloom.__vmodel__
                    if (vm) {
                        $emit(get.list, this, spath, val, older)
                        if (avalon.vtree[vm.$id]) {
                            batchUpdateEntity(vm.$id)
                        }
                    }
                }
            }
        },
        enumerable: true,
        configurable: true
    }
}

//$model的PropertyDescriptor
var $modelDescriptor = {
    get: function () {
        return toJson(this)
    },
    set: noop,
    enumerable: false,
    configurable: true
}

/**
 * 判定此属性能否转换访问器
 * 
 * @param {type} key
 * @param {type} value
 * @param {type} skipArray
 * @returns {Boolean}
 */
function isSkip(key, value, skipArray) {
    return key.charAt(0) === "$" ||
            skipArray[key] ||
            (typeof value === "function") ||
            (value && value.nodeName && value.nodeType > 0)
}

/**
 * 判定是否计算属性的定义对象
 * 
 * @param {type} val
 * @returns {Boolean}
 */
function isComputed(val) {//speed up!
    if (val && typeof val === "object") {
        for (var i in val) {
            if (i !== "get" && i !== "set") {
                return false
            }
        }
        return typeof val.get === "function"
    }
}

/**
 * 抽取用户定义中的所有计算属性的定义
 * 1.5中集中定义在$computed对象中
 * @param {type} obj
 * @returns {Object}
 */
function getComputed(obj) {
    if (obj.$computed) {
        delete obj.$computed
        return obj.$computed
    }
    var $computed = {}
    for (var i in obj) {
        if (isComputed(obj[i])) {
            $computed[i] = obj[i]
            delete obj[i]
        }
    }
    return $computed
}