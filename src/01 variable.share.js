var subscribers = "$" + expose

var nullObject = {} //作用类似于noop，只用于代码防御，千万不要在它上面添加属性
var rword = /[^, ]+/g //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
var rw20g = /\w+/g
var rsvg = /^\[object SVG\w*Element\]$/
var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/
var oproto = Object.prototype
var ohasOwn = oproto.hasOwnProperty
var serialize = oproto.toString
var ap = Array.prototype
var aslice = ap.slice
var W3C = window.dispatchEvent
var root = DOC.documentElement
var avalonFragment = DOC.createDocumentFragment()
var cinerator = DOC.createElement("div")
var class2type = {}
"Boolean Number String Function Array Date RegExp Object Error".replace(rword, function(name) {
    class2type["[object " + name + "]"] = name.toLowerCase()
})
var bindingID = 1024
var IEVersion = NaN
if (window.VBArray) {
    IEVersion = document.documentMode || (window.XMLHttpRequest ? 7 : 6)
}

function noop() {}

function scpCompile(array) {
    return Function.apply(noop, array)
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

//生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var generateID = function(prefix) {
    prefix = prefix || "avalon"
    return String(Math.random() + Math.random()).replace(/\d\.\d{4}/, prefix)
}

var avalon = function(el) { //创建jQuery式的无new 实例化结构
    return new avalon.init(el)
}

/*视浏览器情况采用最快的异步回调*/
avalon.nextTick = new function() { // jshint ignore:line
        var tickImmediate = window.setImmediate
        var tickObserver = window.MutationObserver
        if (tickImmediate) {
            return tickImmediate.bind(window)
        }

        var queue = []

        function callback() {
            var n = queue.length
            for (var i = 0; i < n; i++) {
                queue[i]()
            }
            queue = queue.slice(n)
        }

        if (tickObserver) {
            var node = document.createTextNode("avalon")
            new tickObserver(callback).observe(node, { characterData: true }) // jshint ignore:line
            var bool = false
            return function(fn) {
                queue.push(fn)
                bool = !bool
                node.data = bool
            }
        }


        return function(fn) {
            setTimeout(fn, 4)
        }
    } // jshint ignore:line