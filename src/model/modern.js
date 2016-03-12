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
    var vm = masterFactory(definition, {}, {
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
        avalon.batch($id)
    })

    return vm
}



/**
 * observeArray及observeObject的包装函数
 * @param {type} definition
 * @param {type} old
 * @param {type} heirloom
 * @param {type} options
 * @returns {Observer|Any}
 */
function makeObserve(definition, old, heirloom, options) {
    //如果数组转换为监控数组
    if (Array.isArray(definition)) {
        return arrayFactory(definition, old, heirloom, options)
    } else if (avalon.isPlainObject(definition)) {
        //如果此属性原来就是一个VM,拆分里面的访问器属性
        if (Object(old) === old) {
            var vm = slaveFactory(old, definition, heirloom, options)
            for (var i in definition) {
                if ($$skipArray[i])
                    continue
                vm[i] = definition[i]
            }
            return vm
        } else {
            //否则新建一个VM
            vm = masterFactory(definition, heirloom, options)
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
            if (val && typeof val === "object") {

                val = makeObserve(val, old, heirloom, {
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

        var list = $vmodel.$events[expr]
        $emit(list, $vmodel, expr, a, b)

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



module.exports = avalon
