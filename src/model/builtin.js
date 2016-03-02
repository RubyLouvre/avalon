

var rtopsub = /([^.]+)\.(.+)/

var batchUpdateEntity = require("../strategy/batchUpdateEntity")
var $emit = require("./dispatch").$emit

//一个vm总是为Observer的实例
function Observer() {
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
                        if (heirloom !== vm.$events) {
                            get.heirloom = vm.$events
                        }
                        $emit(get.heirloom[spath], this, spath, val, older)
                        var vid = vm.$id.split(".")[0]

                        batchUpdateEntity(vid, true)

                    }
                }
            }
        },
        enumerable: true,
        configurable: true
    }
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

module.exports = {
    rtopsub: rtopsub,
    Observer: Observer,
    isSkip: isSkip,
    getComputed: getComputed,
    isComputed: isComputed,
    makeComputed: makeComputed
}