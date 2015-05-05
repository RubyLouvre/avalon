var parse5 = require('parse5')
var parser = new parse5.Parser();
var serializer = new parse5.Serializer();
//https://github.com/exolution/xCube/blob/master/XParser.js
//Then feed it with an HTML document



var avalon = {}

var rword = /[^, ]+/g //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
var oproto = Object.prototype
var ohasOwn = oproto.hasOwnProperty
var serialize = oproto.toString
var ap = Array.prototype
var aslice = ap.slice
//生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var generateID = function (prefix) {
    prefix = prefix || "avalon"
    return (prefix + Math.random() + Math.random()).replace(/0\./g, "")
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
/*判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例*/

avalon.isPlainObject = function (obj) {
    // 简单的 typeof obj === "object"检测，会致使用isPlainObject(window)在opera下通不过
    return serialize.call(obj) === "[object Object]" && Object.getPrototypeOf(obj) === oproto
}

avalon.type = function (obj) { //取得目标的类型
    if (obj == null) {
        return String(obj)
    }
    // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
    return typeof obj === "object" || typeof obj === "function" ?
            class2type[serialize.call(obj)] || "object" :
            typeof obj
}
avalon.mix = function () {
    var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false

    // 如果第一个参数为布尔,判定是否深拷贝
    if (typeof target === "boolean") {
        deep = target
        target = arguments[1] || {}
        i++
    }

    //确保接受方为一个复杂的数据类型
    if (typeof target !== "object" && !isFunction(target)) {
        target = {}
    }

    //如果只有一个参数，那么新成员添加于mix所在的对象上
    if (i === length) {
        target = this
        i--
    }

    for (; i < length; i++) {
        //只处理非空参数
        if ((options = arguments[i]) != null) {
            for (name in options) {
                src = target[name]
                copy = options[name]
                // 防止环引用
                if (target === copy) {
                    continue
                }
                if (deep && copy && (avalon.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {

                    if (copyIsArray) {
                        copyIsArray = false
                        clone = src && Array.isArray(src) ? src : []

                    } else {
                        clone = src && avalon.isPlainObject(src) ? src : {}
                    }

                    target[name] = avalon.mix(deep, clone, copy)
                } else if (copy !== void 0) {
                    target[name] = copy
                }
            }
        }
    }
    return target
}
var isFunction = function (fn) {
    return serialize.call(fn) === "[object Function]"
}

avalon.isFunction = isFunction
avalon.vmodels = {}
avalon.scan = function (elem, vmodel) {
    elem = elem  //||  root
    var vmodels = vmodel ? [].concat(vmodel) : []
    scanTag(elem, vmodels)
}
function getAttribute(elem, name) {
    var attrs = elem.attrs || []
    for (var i = 0, attr; attr = attrs[i++]; ) {
        if (attr.name === name)
            return attr.value
    }
}
function scanTag(elem, vmodels) {
    if (elem.tagName) {
        if (getAttribute(elem, "ms-skip"))
            return
        if (!getAttribute(elem, "ms-skip-ctrl")) {
            var ctrl = getAttribute(elem, "ms-important")
            if (ctrl) {
                elem.attrs.push({name: "ms-skip-ctrl", value: "true"})
                var isImporant = true
            } else {
                ctrl = getAttribute(elem, "ms-controller")
                if (ctrl) {
                    elem.attrs.push({name: "ms-skip-ctrl", value: "true"})
                }
            }
            if (ctrl) {
                var newVmodel = avalon.vmodels[ctrl]
                if (!newVmodel) {
                    return
                }
                vmodels = isImporant ? [newVmodel] : [newVmodel].concat(vmodels)
            }
        }
        scanAttr(elem, vmodels)
    } else if (elem.nodeName === "#document") {//如果是文档
        scanNodeArray(elem.childNodes, vmodels)
    } else if (elem.nodeName === "#document-fragment") {//如果是文档
        scanNodeArray(elem.childNodes, vmodels)
    }
}

function scanNodeArray(nodes, vmodels) {
    for (var i = 0, node; node = nodes[i++]; ) {
        scanNode(node, vmodels)
    }
}
function scanNode(node, vmodels) {
    switch (node.nodeName) {
        case "#text": //如果是文本节点
            scanText(node, vmodels)
            break
        case "#comment"://如果是注释节点
            scanText(node, vmodels)
            break
        default://如果是元素节点
            scanTag(node, vmodels)
            break
    }
}

var rmsAttr = /ms-(\w+)-?(.*)/
var priorityMap = {
    "if": 10,
    "repeat": 90,
    "data": 100,
    "widget": 110,
    "each": 1400,
    "with": 1500,
    "duplex": 2000,
    "on": 3000
}
var log = function () {
    // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
    Function.apply.call(console.log, console, arguments)
}
var events = oneObject("animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit")
var obsoleteAttrs = oneObject("value,title,alt,checked,selected,disabled,readonly,enabled")
function bindingSorter(a, b) {
    return a.priority - b.priority
}

function scanAttr(elem, vmodels) {
    var attributes = elem.attrs || []
    var bindings = [],
            msData = {},
            match
    for (var i = attributes.length - 1; i >= 0; i--) {
        var attr = attributes[i]
        if (match = attr.name.match(rmsAttr)) {
            //如果是以指定前缀命名的
            var type = match[1]
            var param = match[2] || ""
            var value = attr.value
            var name = attr.name
            msData[name] = value
            if (events[type]) {
                param = type
                type = "on"
            } else if (obsoleteAttrs[type]) {
                log("warning!请改用ms-attr-" + type + "代替ms-" + type + "！")
                if (type === "enabled") {//吃掉ms-enabled绑定,用ms-disabled代替
                    log("warning!ms-enabled或ms-attr-enabled已经被废弃")
                    type = "disabled"
                    value = "!(" + value + ")"
                }
                param = type
                type = "attr"
                name = "ms-attr-" + param
                attributes.splice(i, 1, {name: name, value: value})
                match = [name]
                msData[name] = value
            }
            if (typeof bindingHandlers[type] === "function") {
                var binding = {
                    type: type,
                    param: param,
                    element: elem,
                    name: match[0],
                    value: value,
                    priority: type in priorityMap ? priorityMap[type] : type.charCodeAt(0) * 10 + (Number(param) || 0)
                }
                if (type === "html" || type === "text") {
                    var token = getToken(value)
                    avalon.mix(binding, token)
                    binding.filters = binding.filters.replace(rhasHtml, function () {
                        binding.type = "html"
                        binding.group = 1
                        return ""
                    })// jshint ignore:line
                }
                if (name === "ms-if-loop") {
                    binding.priority += 100
                }
                if (vmodels.length) {
                    bindings.push(binding)
                    if (type === "widget") {
                        elem.msData = elem.msData || msData
                    }
                }
            }
        }
    }
    bindings.sort(bindingSorter)
    var scanNode = true
    for (i = 0; binding = bindings[i]; i++) {
        type = binding.type
        if (rnoscanAttrBinding.test(type)) {
            return executeBindings(bindings.slice(0, i + 1), vmodels)
        } else if (scanNode) {
            scanNode = !rnoscanNodeBinding.test(type)
        }
    }
    executeBindings(bindings, vmodels)
    if (scanNode && !stopScan[elem.tagName]) {
        scanNodeArray(elem.childNodes, vmodels) //扫描子孙元素
    }
}
var stopScan = oneObject("area,base,basefont,br,col,command,embed,hr,img,input,link,meta,param,source,track,wbr,noscript,script,style,textarea")
var rnoscanAttrBinding = /^if|widget|repeat$/
var rnoscanNodeBinding = /^each|with|html|include$/
bindingHandlers = {
    attr: function () {
    },
    text: function () {
    }
}

//==================================
var rhasHtml = /\|\s*html\s*/,
        r11a = /\|\|/g,
        rlt = /&lt;/g,
        rgt = /&gt;/g,
        rstringLiteral = /(['"])(\\\1|.)+?\1/g
function getToken(value) {
    if (value.indexOf("|") > 0) {
        var scapegoat = value.replace(rstringLiteral, function (_) {
            return Array(_.length + 1).join("1")// jshint ignore:line
        })
        var index = scapegoat.replace(r11a, "\u1122\u3344").indexOf("|") //干掉所有短路或
        if (index > -1) {
            return {
                filters: value.slice(index),
                value: value.slice(0, index),
                expr: true
            }
        }
    }
    return {
        value: value,
        filters: "",
        expr: true
    }
}
function scanText() {

}
function executeBindings() {
}

//var document = parser.parse('<!DOCTYPE html><html><head></head><body>Hi there!</body></html>')
//var documentFragment = parser.parseFragment('<table></table>cccc<!--ddd-->');
//
//console.log(documentFragment)
//
//var trFragment = parser.parseFragment('<tr><td>Shake it, baby</td></tr>', documentFragment.childNodes[0]);
//
//
//console.log(documentFragment)
//
avalon.vmodels.test = {}
var b = parser.parse('<!DOCTYPE html><html ms-controller="test"><head></head><body ms-title=xxx><div>{{aaa}}</div><div>{{bbb}}</div></body></html>')
avalon.scan(b)

var html = b.childNodes[1]
console.log(html)
var a = serializer.serialize(b);
console.log(a)