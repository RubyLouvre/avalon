
var subscribers = "$" + expose
//http://stackoverflow.com/questions/7290086/javascript-use-strict-and-nicks-find-global-function
var window = Function("return this")()
var DOC = window.document
var otherRequire = window.require
var otherDefine = window.define
var stopRepeatAssign = false
var rword = /[^, ]+/g //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
var rnative = /\[native code\]/ //判定是否原生函数
var rcomplexType = /^(?:object|array)$/
var rsvg = /^\[object SVG\w*Element\]$/
var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/
var oproto = Object.prototype
var ohasOwn = oproto.hasOwnProperty
var serialize = oproto.toString
var ap = Array.prototype
var aslice = ap.slice
var Registry = {} //将函数曝光到此对象上，方便访问器收集依赖
var W3C = window.dispatchEvent
var root = DOC.documentElement
var head = DOC.getElementsByTagName("head")[0] //HEAD元素
var hyperspace = DOC.createDocumentFragment()
var cinerator = DOC.createElement("div")
var class2type = {}
"Boolean Number String Function Array Date RegExp Object Error".replace(rword, function(name) {
    class2type["[object " + name + "]"] = name.toLowerCase()
})


function noop() {
}

function log() {
    if (window.console && avalon.config.debug) {
        // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
        Function.apply.call(console.log, console, arguments)
    }
}

function oneObject(array, val) {
    if (typeof array === "string") {
        array = array.match(rword) || []
    }
    var result = {},
            value = val !== void 0 ? val : 1
    for (var i = 0, n = array.length; i < n; i++) {
        result[array[i]] = value
    }
    return result
}

function createCache(maxLength) {
    var keys = []
    function cache(key, value) {
        if (keys.push(key) > maxLength) {
            delete cache[keys.shift()]
        }
        return cache[key] = value;
    }
    return cache;
}
//生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var generateID = window.performance ? function() {
    return ("avalon" + performance.now() + performance.now()).replace(/\./g, "")
} : function() {
    return ("avalon" + Math.random() + Math.random()).replace(/0\./g, "")
}
