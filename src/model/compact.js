var canHideProperty = require("./canHideProperty")
var defineProperties = require("./defineProperties")
var $$skipArray = require("./skipArray.compact")

var vars = require("../base/builtin")

var oneObject = vars.oneObject
var makeHashCode = vars.makeHashCode
var ap = vars.ap
var W3C = vars.ap
var rword = vars.rword

var innerBuiltin = require("./builtin")
var isSkip = innerBuiltin.isSkip
var getComputed = innerBuiltin.getComputed
var makeComputed = innerBuiltin.makeComputed
var Observer = innerBuiltin.Observer
var rtopsub = innerBuiltin.rtopsub
var createRender = require("../parser/createRender")
var diff = require("../parser/diff")

var batchUpdateEntity = require("../strategy/batchUpdateEntity")

var dispatch = require("./dispatch")
var $watch = dispatch.$watch
var $emit = dispatch.$emit

//所有vmodel都储存在这
avalon.vmodels = {}

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
 
 * 
 * @param {Object} definition 用户定义
 * @returns {Observer} vm
 */
function define(definition) {
    var $id = definition.$id
    if (!$id) {
        avalon.log("warning: vm.$id must be specified")
    }
    var vm = observeObject(definition, {}, {
        pathname: "",
        idname: $id,
        top: true
    })

    if (avalon.vmodels[$id]) {
        throw Error("warning:[", $id, "] had defined!")
    }
    avalon.vmodels[$id] = vm
    avalon.ready(function () {
        var elem = document.getElementById($id)
        vm.$element = elem
        var now = new Date - 0
        var vnode = avalon.createVirtual(elem.outerHTML)
        avalon.log("create primitive vtree", new Date - now)
        now = new Date
        vm.$render = avalon.createRender(vnode)
        avalon.log("create template Function ", new Date - now)
      
        batchUpdateEntity($id)

    })

    return vm
}


/**
 * 生成一个vm
 *
 * @param {Object} definition 用户的原始数据
 * @param {Object} heirloom   用来保存顶层vm的引用
 * @param {Object} options
 *        top      {Boolean} 是否顶层vm
 *        idname   {String}  $id
 *        pathname {String}  当前路径
 * @returns {Observer}
 */

function observeObject(definition, heirloom, options) {
    options = options || {}
    var $skipArray = {}

    if (definition.$skipArray) {//收集所有不可监听属性
        $skipArray = oneObject(definition.$skipArray)
        delete definition.$skipArray
    }

    var keys = {}
    var $accessors = {}
    var $vmodel = new Observer()
    var $pathname = options.pathname || ""
    var $computed = getComputed(definition)
    var $idname = options.idname || makeHashCode("$")

    var key, sid, spath

    for (key in definition) {
        if ($$skipArray[key])
            continue
        var val = keys[key] = definition[key]
        if (!isSkip(key, val, $skipArray)) {
            sid = $idname + "." + key
            spath = $pathname ? $pathname + "." + key : key
            $accessors[key] = makeObservable(sid, spath, heirloom)
        }
    }

    for (key in $computed) {
        keys[key] = definition[key]
        sid = $idname + "." + key
        spath = $pathname ? $pathname + "." + key : key
        $accessors[key] = makeComputed(sid, spath, heirloom, key, $computed[key])
    }

    $accessors.$model = $modelAccessor

    $vmodel = defineProperties($vmodel, $accessors, definition)

    for (key in keys) {
        //对普通监控属性或访问器属性进行赋值
        if (!(key in $computed)) {
            $vmodel[key] = keys[key]
        }
        //删除系统属性
        if (key in $skipArray) {
            delete keys[key]
        } else {
            keys[key] = true
        }
    }

    function hasOwnKey(key) {
        return keys[key] === true
    }

    hideProperty($vmodel, "$id", $idname)
    hideProperty($vmodel, "$accessors", $accessors)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)

    if (options.top === true) {
        makeFire($vmodel, heirloom)
    }

    for (key in $computed) {
        val = $vmodel[key]
    }

    hideProperty($vmodel, "$hashcode", makeHashCode("$"))

    return $vmodel
}


/**
 * observeArray及observeObject的包装函数
 * @param {type} definition
 * @param {type} old
 * @param {type} heirloom
 * @param {type} options
 * @returns {Observer|Any}
 */
function observe(definition, old, heirloom, options) {
    //如果数组转换为监控数组
    if (Array.isArray(definition)) {
        return observeArray(definition, old, heirloom, options)
    } else if (avalon.isPlainObject(definition)) {
        //如果此属性原来就是一个VM,拆分里面的访问器属性
        if (Object(old) === old) {
            var vm = subModelFactory(old, definition, heirloom, options)
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
    get.heirloom = heirloom
    return {
        get: get,
        set: function (val) {
            if (old === val) {
                return
            }
            if (val && typeof val === "object") {
                if (old && old.$id && val.$id && !Array.isArray(old)) {
                    //合并两个对象类型的子vm,比如proxy item中的el = newEl
                    for (var ii in val) {
                        old[ii] = val[ii]
                    }
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
                if (vm && heirloom !== vm.$events) {
                    get.heirloom = vm.$events
                }
                $emit(get.heirloom[spath], vm, spath, val, older)
                if (sid.indexOf(".*.") > 0) {//如果是item vm
                    var arr = sid.match(rtopsub)
                    var top = avalon.vmodels[ arr[1] ]
                    if (top) {
                        var path = arr[2]
                        $emit(top.$events[ path ], vm, path, val, older)
                    }
                }
                var vid = vm.$id.split(".")[0]
                avalon.rerenderStart = new Date
                batchUpdateEntity(vid, true)


            }
        },
        enumerable: true,
        configurable: true
    }
}
/**
 * 为vm添加$events, $watch, $fire方法
 *
 * @param {Observer} $vmodel
 * @returns {undefined}
 */
function makeFire($vmodel, heirloom) {
    heirloom.__vmodel__ = $vmodel
    hideProperty($vmodel, "$events", heirloom)
    hideProperty($vmodel, "$watch", function (expr, fn) {
        if (arguments.length === 2) {
            return $watch.apply($vmodel, arguments)
        } else {
            throw "$watch方法参数不对"
        }
    })
    hideProperty($vmodel, "$fire", function (expr, a, b) {
        if (expr.indexOf("all!") === 0) {
            var p = expr.slice(4)
            for (var i in avalon.vmodels) {
                var v = avalon.vmodels[i]
                v.$fire && v.$fire(p, a, b)
            }
        } else {
            var list = $vmodel.$events[expr]
            $emit(list, $vmodel, expr, a, b)
        }
    })
}

/**
 * 生成vm的$model
 *
 * @param {Observer} val
 * @returns {Object|Array}
 */
function toJson(val) {
    var xtype = avalon.type(val)
    if (xtype === "array") {
        var array = []
        for (var i = 0; i < val.length; i++) {
            array[i] = toJson(val[i])
        }
        return array
    } else if (xtype === "object") {
        var obj = {}
        for (i in val) {
            if (i === "__proxy__" || i === "__data__" || i === "__const__")
                continue
            if (val.hasOwnProperty(i)) {
                var value = val[i]
                obj[i] = value && value.nodeType ? value : toJson(value)
            }
        }
        return obj
    }
    return val
}

//$model的PropertyDescriptor
var $modelAccessor = {
    get: function () {
        return toJson(this)
    },
    set: avalon.noop,
    enumerable: false,
    configurable: true
}
/**
 * 添加不可遍历的系统属性($$skipArray中的那些属性)
 *
 * @param {type} host
 * @param {type} name
 * @param {type} value
 * @returns {undefined}
 */

function hideProperty(host, name, value) {
    if (canHideProperty) {
        Object.defineProperty(host, name, {
            value: value,
            writable: true,
            enumerable: false,
            configurable: true
        })
    } else {
        host[name] = value
    }
}

/**************************************
 * *************************************
 ***************************************/
/**
 * 回收已有子vm构建新的子vm
 * 用于vm.obj = newObj 的场合
 * 
 * @param {Observer} before
 * @param {Observer} after
 * @param {Object} heirloom
 * @param {Object} options
 * @returns {Observer}
 */

function subModelFactory(before, after, heirloom, options) {
    var keys = {}
    var $accessors = {}
    var $idname = options.idname
    var $pathname = options.pathname
    var resue = before.$accessors || {}

    var key, sid, spath
    var skips = {}
    for (key in after) {
        if ($$skipArray[key])
            continue
        keys[key] = true
        if (!isSkip(key, after[key], {})) {
            if (resue[key]) {
                $accessors[key] = resue[key]
            } else {
                sid = $idname + "." + key
                spath = $pathname ? $pathname + "." + key : key
                $accessors[key] = makeObservable(sid, spath, heirloom)
            }
        } else {
            skips[key] = after[key]
        }
    }
    var hashcode = before.$hashcode
    $accessors.$model = $modelAccessor
    var $vmodel = new Observer()
    $vmodel = defineProperties($vmodel, $accessors, skips)

    for (key in skips) {
        $vmodel[key] = skips[key]
        delete after[key]
    }
    function hasOwnKey(key) {
        return keys[key] === true
    }
    if (options.top === true) {
        makeFire($vmodel, heirloom)
    }
    before.$hashcode = false
    hideProperty($vmodel, "$id", $idname)
    hideProperty($vmodel, "$accessors", $accessors)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    hideProperty($vmodel, "$hashcode", hashcode || makeHashCode("$"))

    return $vmodel
}
/**************************************
 ***************************************
 ***************************************/
/**
 * 合并两个vm为一个vm,方便依赖收集
 *
 * @param {Component} before
 * @param {Component} after
 * @param {Object} heirloom
 * @returns {Component}
 */
function mediatorFactory(before, after, heirloom, callback) {
    heirloom = heirloom || {}
    var b = before.$accessors || {}
    var a = after.$accessors || {}
    var $accessors = {}
    var keys = {}, key
    //收集所有键值对及访问器属性
    for (key in before) {
        keys[key] = before[key]
        if (b[key]) {
            $accessors[key] = b[key]
        }
    }

    for (key in after) {
        keys[key] = after[key]
        if (a[key]) {
            $accessors[key] = a[key]
        }
    }
    callback && callback(keys, $accessors)

    var $vmodel = new Observer()
    $vmodel = defineProperties($vmodel, $accessors, keys)

    for (key in keys) {
        if (!$accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        if (key in $$skipArray) {
            delete keys[key]
        } else {
            keys[key] = true
        }
    }

    function hasOwnKey(key) {
        return keys[key] === true
    }

    makeFire($vmodel, heirloom)
    hideProperty($vmodel, "$id", before.$id)
    hideProperty($vmodel, "$accessors", $accessors)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    hideProperty($vmodel, "$hashcode", makeHashCode("$"))

    return $vmodel
}



/*********************************************************************
 *          监控数组（与ms-each, ms-repeat配合使用）                     *
 **********************************************************************/
function observeArray(array, old, heirloom, options) {
    if (old && old.splice) {
        var args = [0, old.length].concat(array)
        old.splice.apply(old, args)
        return old
    } else {
        for (var i in newProto) {
            array[i] = newProto[i]
        }

        var hashcode = makeHashCode("$")
        hideProperty(array, "$hashcode", hashcode)
        hideProperty(array, "$id", options.idname || hashcode)
        if (options.top) {
            makeFire(array, heirloom)
        }
        array.notify = function (a, b, c) {
            var vm = heirloom.__vmodel__
            if (vm) {
                var path = a === null || a === void 0 ?
                        options.pathname :
                        options.pathname + "." + a
                vm.$fire(path, b, c)
                avalon.rerenderStart = new Date
                batchUpdateEntity(vm.$id, true)
            }
        }

        if (W3C) {
            hideProperty(array, "$model", $modelAccessor)
        } else {
            array.$model = toJson(array)
        }

        var arrayOptions = {
            idname: array.$id + ".*",
            top: true
        }
        for (var j = 0, n = array.length; j < n; j++) {
            array[j] = observeItem(array[j], {}, arrayOptions)
        }

        return array
    }
}


function observeItem(item, a, b) {
    if (avalon.isObject(item)) {
        return observe(item, 0, a, b)
    } else {
        return item
    }
}

var arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice']
var newProto = {
    set: function (index, val) {
        if (((index >>> 0) === index) && this[index] !== val) {
            if (index > this.length) {
                throw Error(index + "set方法的第一个参数不能大于原数组长度")
            }
            this.notify("*", val, this[index])
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
    removeAll: function (all) { //移除N个元素
        var on = this.length
        if (Array.isArray(all)) {
            for (var i = this.length - 1; i >= 0; i--) {
                if (all.indexOf(this[i]) !== -1) {
                    _splice.call(this, i, 1)
                }
            }
        } else if (typeof all === "function") {
            for (i = this.length - 1; i >= 0; i--) {
                var el = this[i]
                if (all(el, i)) {
                    _splice.call(this, i, 1)
                }
            }
        } else {
            _splice.call(this, 0, this.length)

        }
        if (!W3C) {
            this.$model = toJson(this)
        }
        this.notify()
        notifySize(this, on)
    },
    clear: function () {
        this.removeAll()
        return this
    }
}

function notifySize(array, on) {
    if (array.length !== on) {
        array.notify("length", array.length, on)
    }
}

var _splice = ap.splice

arrayMethods.forEach(function (method) {
    var original = ap[method]
    newProto[method] = function (a, b) {
        // 继续尝试劫持数组元素的属性
        var args = [], on = this.length
        var options = {
            idname: this.$id + ".*",
            top: true
        }
        if (method === "splice" && this[0] && typeof this[0] === "object") {
            var old = this.slice(a, b)
            var neo = ap.slice.call(arguments, 2)
            var args = [a, b]
            for (var j = 0, jn = neo.length; j < jn; j++) {
                args[j + 2] = observe(neo[j], old[j], old[j] && old[j].$events, options)
            }
        } else {
            for (var i = 0, n = arguments.length; i < n; i++) {
                args[i] = observeItem(arguments[i], {}, options)
            }
        }


        var result = original.apply(this, args)
        if (!W3C) {
            this.$model = toJson(this)
        }
        this.notify()
        notifySize(this, on)
        return result
    }
})

"sort,reverse".replace(rword, function (method) {
    newProto[method] = function () {
        ap[method].apply(this, arguments)
        if (!W3C) {
            this.$model = toJson(this)
        }
        this.notify()
        return this
    }
})

module.exports = {
    observeArray: observeArray,
    observeObject: observeObject,
    makeObservable: makeObservable,
    mediatorFactory: mediatorFactory,
    define: define
}
//使用这个来扁平化数据  https://github.com/gaearon/normalizr
//使用Promise  https://github.com/stefanpenner/es6-promise
//使用这个AJAX库 https://github.com/matthew-andrews/isomorphic-fetch