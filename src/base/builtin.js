

var ap = Array.prototype
var op = Object.prototype
var rword = /[^, ]+/g
var rd4 = /\d\.\d{4}/
var rhyphen = /([a-z\d])([A-Z]+)/g
var rcamelize = /[-_][^-_]/g
var isStaticNode = false
var window = global
var serialize = op.toString


function noop() {
}
var builtin = {
    log: function () {
        if (window.console && avalon.config.debug) {
            // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
            Function.apply.call(console.log, console, arguments)
        }
    },
    error: function (str, e) {
        throw (e || Error)(str)
    },
    /* avalon.range(10)
     => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     avalon.range(1, 11)
     => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     avalon.range(0, 30, 5)
     => [0, 5, 10, 15, 20, 25]
     avalon.range(0, -10, -1)
     => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
     avalon.range(0)
     => []*/
    range: function (start, end, step) { // 用于生成整数数组
        step || (step = 1)
        if (end == null) {
            end = start || 0
            start = 0
        }
        var index = -1,
                length = Math.max(0, Math.ceil((end - start) / step)),
                result = new Array(length)
        while (++index < length) {
            result[index] = start
            start += step
        }
        return result
    },
    noop: noop,
    //作用类似于noop，只用于代码防御，千万不要在它上面添加属性
    nullObject: {},
    //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
    rword: rword,
    rw20g: /\w+/g,
    rsvg: /^\[object SVG\w*Element\]$/,
    ramp: /&amp;/g,
    rmsAttr: /^(?:ms|av)-(\w+)-?(.*)/,
    document: {//方便在nodejs环境不会报错
        createElement: function () {
            return {}
        },
        contains: noop
    },
    root: {
        outerHTML: "x"
    },
    ap: ap,
    op: op,
    ohasOwn: op.hasOwnProperty,
    aslice: ap.slice,
    W3C: true,
    window: global,
    serialize: serialize,
    bindingID: 1,
    msie: NaN,
    //生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    makeHashCode: function (prefix) {
        prefix = prefix || "avalon"
        return String(Math.random() + Math.random()).replace(rd4, prefix)
    },
    markID: function (fn) {
        return fn.uuid || (fn.uuid = builtin.makeHashCode("e"))
    },
    /*将一个以空格或逗号隔开的字符串或数组,转换成一个键值都为1的对象*/
    oneObject: function (array, val) {
        if (typeof array === "string") {
            array = array.match(rword) || []
        }
        var result = {},
                value = val !== void 0 ? val : 1
        for (var i = 0, n = array.length; i < n; i++) {
            result[array[i]] = value
        }
        return result
    },
    hyphen: function (target) {
        //转换为连字符线风格
        return target.replace(rhyphen, "$1-$2").toLowerCase()
    },
    camelize: function (target) {
        //提前判断，提高getStyle等的效率
        if (!target || target.indexOf("-") < 0 && target.indexOf("_") < 0) {
            return target
        }
        //转换为驼峰风格
        return target.replace(rcamelize, function (match) {
            return match.charAt(1).toUpperCase()
        })
    },
    pushArray: function (target, other) {
        target.push.apply(target, other)
    }
}

if (window.window === window) {
    var document = window.document
    builtin.W3C = window.dispatchEvent
    builtin.document = document
    builtin.root = document.documentElement
    builtin.avalonFragment = document.createDocumentFragment()
    builtin.div = document.createElement("div")
    if (window.VBArray) {
        builtin.msie = document.documentMode || (window.XMLHttpRequest ? 7 : 6)
    }
    var textNode = document.createTextNode("test")
    try {
        textNode.uuid = 1234
    } catch (e) {
        isStaticNode = true
    }
}

builtin.nextTick = (function () {// jshint ignore:line
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
        new tickObserver(callback).observe(node, {characterData: true})// jshint ignore:line
        var bool = false
        return function (fn) {
            queue.push(fn)
            bool = !bool
            node.data = bool
        }
    }
    return function (fn) {
        setTimeout(fn, 4)
    }
})()

var nodeList = []
var uuidList = []
function getUid(el) {
    //对IE6-8的文本节点或注释节点(甚至对其toString, childNodes等子属性)添加任何属性都会抛错
    if (isStaticNode && (el.nodeType === 3 || el.nodeType === 8)) {
        var index = nodeList.indexOf(el)
        if (index === -1) {
            index = nodeList.push(el)
            var uuid = "_" + (++builtin.bindingID)
            return uuidList[index] = uuid
        } else {
            return uuidList[index]
        }
    }
    return el.uuid || (el.uuid = "_" + (++builtin.bindingID))
}


var meta = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\'
}
var quote = typeof JSON !== "undefined" ? JSON.stringify : function (str) {
    return '"' + str.replace(/[\\\"\x00-\x1f]/g, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"'
}

builtin.quote = quote
builtin.getUid = getUid

var class2type = {}
"Boolean Number String Function Array Date RegExp Object Error".replace(rword, function (name) {
    class2type["[object " + name + "]"] = name.toLowerCase()
})

builtin.type = function (obj) { //取得目标的类型
    if (obj == null) {
        return String(obj)
    }
    // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
    return typeof obj === "object" || typeof obj === "function" ?
            class2type[serialize.call(obj)] || "object" :
            typeof obj
}

module.exports = builtin


