var $$skipArray = require("./skipArray")


var dispatch = require("../strategy/dispatch")
var $watch = dispatch.$watch
var $emit = dispatch.$emit

var rtopsub = /([^.]+)\.(.+)/
var ap = Array.prototype
var rword = avalon.rword
var oneObject = avalon.oneObject
var makeHashCode = avalon.makeHashCode

//一个vm总是为Observer的实例
function Observer() {
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

//所有vmodel都储存在这
avalon.vmodels = {}

/**
 * avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个vm
 *  vm拥有如下私有属性
 
 $id: vm.$id
 $events: 放置$watch回调与绑定对象
 $watch: 增强版$watch
 $element: 关联ID为vm.$id的元素节点
 $render: vm的模板函数
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
        avalon.log("warning: vm必须指定$id")
    }
    var vm = observeObject(definition, {}, {
        pathname: "",
        idname: $id,
        top: true
    })
    avalon.vmodels[$id] = vm
    avalon.ready(function () {
        var elem = document.getElementById($id)
        vm.$element = elem
        var now = new Date - 0
        var vnode = avalon.lexer(elem.outerHTML)
        avalon.log("create primitive vtree", new Date - now)
        now = new Date
        vm.$render = avalon.render(vnode)
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

    var $skipArray = {}//收集所有不可监听属性
    if (definition.$skipArray) {
        $skipArray = oneObject(definition.$skipArray)
        delete definition.$skipArray
    }

    //处女症发作!
    var keys = {}
    var $accessors = {}
    var $vmodel = new Observer()
    var $pathname = options.pathname || ""
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


    $accessors.$model = $modelAccessor

    Object.defineProperties($vmodel, $accessors)

    for (key in keys) {
        //对普通监控属性或访问器属性进行赋值
       
            $vmodel[key] = keys[key]
       
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
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    //在高级浏览器,我们不需要搞一个$accessors存放所有访问器属性的定义
    //直接用Object.getOwnPropertyDescriptor获取它们
    if (options.top === true) {
        makeFire($vmodel, heirloom)
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
             
                    val = observe(val, old, heirloom, {
                        pathname: spath,
                        idname: sid
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
                $emit(get.heirloom[spath], this, spath, val, older)
                if (sid.indexOf(".*.") > 0) {//如果是item vm
                    var arr = sid.match(rtopsub)
                    var top = avalon.vmodels[ arr[1] ]
                    if (top) {
                        var path = arr[2]
                        $emit(top.$events[ path ], this, path, val, older)
                    }
                }
                
                avalon.rerenderStart = new Date
                avalon.batch(vm.$id.split(".")[0])
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
    hideProperty($vmodel, "$watch", $watch)
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
    Object.defineProperty(host, name, {
        value: value,
        writable: true,
        enumerable: false,
        configurable: true
    })
}

/**************************************
 * *************************************
 ***************************************/

/**************************************
 ***************************************
 ***************************************/



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
        array.notify = function (a, b, c, d) {
            var vm = heirloom.__vmodel__
            if (vm) {
                var path = a === null || a === void 0 ?
                        options.pathname :
                        options.pathname + "." + a
                vm.$fire(path, b, c)
                if (!d) {
                    avalon.rerenderStart = new Date
                    avalon.batch(vm.$id, true)
                }
            }
        }

        hideProperty(array, "$model", $modelAccessor)

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

            this.notify("*", val, this[index], true)
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
        var size = this.length
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

        notifySize(this, size)
        this.notify()

    },
    clear: function () {
        this.removeAll()
        return this
    }
}

function notifySize(array, size) {
    if (array.length !== size) {
        array.notify("length", array.length, size, true)
    }
}

var _splice = ap.splice

arrayMethods.forEach(function (method) {
    var original = ap[method]
    newProto[method] = function () {
        // 继续尝试劫持数组元素的属性
        var args = [], size = this.length
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
        notifySize(this, size)
        this.notify()
        return result
    }
})

"sort,reverse".replace(rword, function (method) {
    newProto[method] = function () {
        ap[method].apply(this, arguments)

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
