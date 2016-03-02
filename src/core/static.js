var vars = require("../base/builtin")
var window = vars.window
var noop = vars.noop

var cssHooks = {}

avalon.mix({
    caches: {},
    version: 1.6,
    ui: {}, //兼容1.4.*
    bindingHandlers: {}, //兼容1.4.*
    bindingExecutors: {}, //兼容1.4.*
    getWidgetData: avalon.noop, //兼容1.4.*

    eventHooks: {},
    cssHooks: cssHooks,
    filters: {},
    /*读写删除元素节点的样式*/
    css: function (node, name, value) {
        if (node instanceof avalon) {
            node = node[0]
        }
        var prop = /[_-]/.test(name) ? vars.camelize(name) : name,
                fn
        name = avalon.cssName(prop) || prop
        if (value === void 0 || typeof value === "boolean") { //获取样式
            fn = cssHooks[prop + ":get"] || cssHooks["@:get"]
            if (name === "background") {
                name = "backgroundColor"
            }
            var val = fn(node, name)
            return value === true ? parseFloat(val) || 0 : val
        } else if (value === "") { //请除样式
            node.style[name] = ""
        } else { //设置样式
            if (value == null || value !== value) {
                return
            }
            if (isFinite(value) && !avalon.cssNumber[prop]) {
                value += "px"
            }
            fn = cssHooks[prop + ":set"] || cssHooks["@:set"]
            fn(node, name, value)
        }
    },
    components: {}, //1.5新增
    
    isObject: function (a) {//1.6新增
        return a !== null && typeof a === "object"
    },
    
    Array: {
        /*只有当前数组不存在此元素时只添加它*/
        ensure: function (target, item) {
            if (target.indexOf(item) === -1) {
                return target.push(item)
            }
        },
        /*移除数组中指定位置的元素，返回布尔表示成功与否*/
        removeAt: function (target, index) {
            return !!target.splice(index, 1).length
        },
        /*移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否*/
        remove: function (target, item) {
            var index = target.indexOf(item)
            if (~index)
                return avalon.Array.removeAt(target, index)
            return false
        }
    }
})

var directives = avalon.directives = {}

avalon.directive = function (name, obj) {
    avalon.bindingHandlers[name] = obj.init = (obj.init || noop)
    avalon.bindingExecutors[name] = obj.update = (obj.update || noop)

    return directives[name] = obj
}
