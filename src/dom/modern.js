/*********************************************************************
 *                          DOM Api                               *
 *           补丁,接口,css,attr,html,val,event                     *
 **********************************************************************/

var builtin = require("../base/builtin")
require("./attr")
require("./css")
var document = builtin.document
var window = builtin.window
var root = builtin.root
var ap = builtin.ap
var rword = builtin.rword
var rsvg = builtin.rsvg
var W3C = builtin.W3C
var camelize = builtin.camelize

/*******************************
 *************打补丁***************
 ********************************/

//safari5+是把contains方法放在Element.prototype上而不是Node.prototype
if (!document.contains) {
    Node.prototype.contains = function (arg) {
        return !!(this.compareDocumentPosition(arg) & 16)
    }
}
avalon.contains = function (root, el) {
    try {
        while ((el = el.parentNode))
            if (el === root)
                return true
        return false
    } catch (e) {
        return false
    }
}

if (window.SVGElement) {
    var svgns = "http://www.w3.org/2000/svg"
    var svg = document.createElementNS(svgns, "svg")
    svg.innerHTML = '<circle cx="50" cy="50" r="40" fill="red" />'
    if (!rsvg.test(svg.firstChild)) {// #409
        /* jshint ignore:start */
        function enumerateNode(node, targetNode) {
            if (node && node.childNodes) {
                var nodes = node.childNodes
                for (var i = 0, el; el = nodes[i++]; ) {
                    if (el.tagName) {
                        var svg = document.createElementNS(svgns,
                                el.tagName.toLowerCase())
                        // copy attrs
                        ap.forEach.call(el.attributes, function (attr) {
                            svg.setAttribute(attr.name, attr.value)
                        })
                        // 递归处理子节点
                        enumerateNode(el, svg)
                        targetNode.appendChild(svg)
                    }
                }
            }
        }
        /* jshint ignore:end */
        Object.defineProperties(SVGElement.prototype, {
            "outerHTML": {//IE9-11,firefox不支持SVG元素的innerHTML,outerHTML属性
                enumerable: true,
                configurable: true,
                get: function () {
                    return new XMLSerializer().serializeToString(this)
                },
                set: function (html) {
                    var tagName = this.tagName.toLowerCase(),
                            par = this.parentNode,
                            frag = avalon.parseHTML(html)
                    // 操作的svg，直接插入
                    if (tagName === "svg") {
                        par.insertBefore(frag, this)
                        // svg节点的子节点类似
                    } else {
                        var newFrag = document.createDocumentFragment()
                        enumerateNode(frag, newFrag)
                        par.insertBefore(newFrag, this)
                    }
                    par.removeChild(this)
                }
            },
            "innerHTML": {
                enumerable: true,
                configurable: true,
                get: function () {
                    var s = this.outerHTML
                    var ropen = new RegExp("<" + this.nodeName + '\\b(?:(["\'])[^"]*?(\\1)|[^>])*>', "i")
                    var rclose = new RegExp("<\/" + this.nodeName + ">$", "i")
                    return  s.replace(ropen, "").replace(rclose, "")
                },
                set: function (html) {
                    if (avalon.clearHTML) {
                        avalon.clearHTML(this)
                        var frag = avalon.parseHTML(html)
                        enumerateNode(frag, this)
                    }
                }
            }
        })
    }
}

/*******************************
 **************method**************
 ********************************/
"add,remove".replace(rword, function (method) {
    avalon.fn[method + "Class"] = function (cls) {
        var el = this[0]
        //https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/26
        if (cls && typeof cls === "string" && el && el.nodeType === 1) {
            cls.replace(/\S+/g, function (c) {
                el.classList[method](c)
            })
        }
        return this
    }
})

avalon.fn.mix({
    hasClass: function (cls) {
        var el = this[0] || {} //IE10+, chrome8+, firefox3.6+, safari5.1+,opera11.5+支持classList,chrome24+,firefox26+支持classList2.0
        return el.nodeType === 1 && el.classList.contains(cls)
    },
    toggleClass: function (value, stateVal) {
        var className, i = 0
        var classNames = String(value).split(/\s+/)
        var isBool = typeof stateVal === "boolean"
        while ((className = classNames[i++])) {
            var state = isBool ? stateVal : !this.hasClass(className)
            this[state ? "addClass" : "removeClass"](className)
        }
        return this
    },
    attr: function (name, value) {
        if (arguments.length === 2) {
            this[0].setAttribute(name, value)
            return this
        } else {
            return this[0].getAttribute(name)
        }
    },
    data: function (name, value) {
        name = "data-" + hyphen(name || "")
        switch (arguments.length) {
            case 2:
                this.attr(name, value)
                return this
            case 1:
                var val = this.attr(name)
                return parseData(val)
            case 0:
                var ret = {}
                ap.forEach.call(this[0].attributes, function (attr) {
                    if (attr) {
                        name = attr.name
                        if (!name.indexOf("data-")) {
                            name = camelize(name.slice(5))
                            ret[name] = parseData(attr.value)
                        }
                    }
                })
                return ret
        }
    },
    removeData: function (name) {
        name = "data-" + hyphen(name)
        this[0].removeAttribute(name)
        return this
    },
    css: function (name, value) {
        if (avalon.isPlainObject(name)) {
            for (var i in name) {
                avalon.css(this, i, name[i])
            }
        } else {
            var ret = avalon.css(this, name, value)
        }
        return ret !== void 0 ? ret : this
    },
    position: function () {
        var offsetParent, offset,
                elem = this[0],
                parentOffset = {
                    top: 0,
                    left: 0
                };
        if (!elem) {
            return
        }
        if (this.css("position") === "fixed") {
            offset = elem.getBoundingClientRect()
        } else {
            offsetParent = this.offsetParent() //得到真正的offsetParent
            offset = this.offset() // 得到正确的offsetParent
            if (offsetParent[0].tagName !== "HTML") {
                parentOffset = offsetParent.offset()
            }
            parentOffset.top += avalon.css(offsetParent[0], "borderTopWidth", true)
            parentOffset.left += avalon.css(offsetParent[0], "borderLeftWidth", true)
            // Subtract offsetParent scroll positions
            parentOffset.top -= offsetParent.scrollTop()
            parentOffset.left -= offsetParent.scrollLeft()
        }
        return {
            top: offset.top - parentOffset.top - avalon.css(elem, "marginTop", true),
            left: offset.left - parentOffset.left - avalon.css(elem, "marginLeft", true)
        }
    },
    offsetParent: function () {
        var offsetParent = this[0].offsetParent
        while (offsetParent && avalon.css(offsetParent, "position") === "static") {
            offsetParent = offsetParent.offsetParent;
        }
        return avalon(offsetParent || root)
    },
    bind: function (type, fn, phase) {
        if (this[0]) { //此方法不会链
            return avalon.bind(this[0], type, fn, phase)
        }
    },
    unbind: function (type, fn, phase) {
        if (this[0]) {
            avalon.unbind(this[0], type, fn, phase)
        }
        return this
    },
    val: function (value) {
        var node = this[0]
        if (node && node.nodeType === 1) {
            var get = arguments.length === 0
            var access = get ? ":get" : ":set"
            var fn = valHooks[getValType(node) + access]
            if (fn) {
                var val = fn(node, value)
            } else if (get) {
                return (node.value || "").replace(/\r/g, "")
            } else {
                node.value = value
            }
        }
        return get ? val : this
    }
})

if (root.dataset) {
    avalon.fn.data = function (name, val) {
        name = name && camelize(name)
        var dataset = this[0].dataset
        switch (arguments.length) {
            case 2:
                dataset[name] = val
                return this
            case 1:
                val = dataset[name]
                return parseData(val)
            case 0:
                var ret = createMap()
                for (name in dataset) {
                    ret[name] = parseData(dataset[name])
                }
                return ret
        }
    }
}
var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/
avalon.parseJSON = JSON.parse

function parseData(data) {
    try {
        if (typeof data === "object")
            return data
        data = data === "true" ? true :
                data === "false" ? false :
                data === "null" ? null : +data + "" === data ? +data : rbrace.test(data) ? JSON.parse(data) : data
    } catch (e) {
    }
    return data
}

/*******************************
 **************css**************
 ********************************/

/*******************************
 **************attr**************
 ********************************/


/*******************************
 **************html**************
 ********************************/
//parseHTML的辅助变量
var tagHooks = new function () {// jshint ignore:line
    avalon.mix(this, {
        option: document.createElement("select"),
        thead: document.createElement("table"),
        td: document.createElement("tr"),
        area: document.createElement("map"),
        tr: document.createElement("tbody"),
        col: document.createElement("colgroup"),
        legend: document.createElement("fieldset"),
        _default: document.createElement("div"),
        "g": document.createElementNS("http://www.w3.org/2000/svg", "svg")
    })
    this.optgroup = this.option
    this.tbody = this.tfoot = this.colgroup = this.caption = this.thead
    this.th = this.td
}// jshint ignore:line
String("circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use").replace(rword, function (tag) {
    tagHooks[tag] = tagHooks.g //处理SVG
})

var rtagName = /<([\w:]+)/
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig
var scriptTypes = oneObject(["", "text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript"])
var script = document.createElement("script")
var rhtml = /<|&#?\w+;/

avalon.parseHTML = function (html) {
    var fragment = builtin.avalonFragment.cloneNode(false)
    if (typeof html !== "string") {
        return fragment
    }
    if (!rhtml.test(html)) {
        fragment.appendChild(document.createTextNode(html))
        return fragment
    }
    html = html.replace(rxhtml, "<$1></$2>").trim()
    var tag = (rtagName.exec(html) || ["", ""])[1].toLowerCase(),
            //取得其标签名
            wrapper = tagHooks[tag] || tagHooks._default,
            firstChild
    wrapper.innerHTML = html
    var els = wrapper.getElementsByTagName("script")
    if (els.length) { //使用innerHTML生成的script节点不会发出请求与执行text属性
        for (var i = 0, el; el = els[i++]; ) {
            if (scriptTypes[el.type]) {
                var neo = script.cloneNode(false) //FF不能省略参数
                ap.forEach.call(el.attributes, function (attr) {
                    neo.setAttribute(attr.name, attr.value)
                })// jshint ignore:line
                neo.text = el.text
                el.parentNode.replaceChild(neo, el)
            }
        }
    }

    while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
        fragment.appendChild(firstChild)
    }
    return fragment
}

avalon.innerHTML = function (node, html) {
    var a = this.parseHTML(html)
    this.clearHTML(node).appendChild(a)
}

avalon.clearHTML = function (node) {
    node.textContent = ""
    while (node.lastChild) {
        node.removeChild(node.lastChild)
    }
    return node
}

/*******************************
 **************val**************
 ********************************/
function getValType(elem) {
    var ret = elem.tagName.toLowerCase()
    return ret === "input" && /checkbox|radio/.test(elem.type) ? "checked" : ret
}
var valHooks = {
    "select:get": function self(node, ret, index, singleton) {
        var nodes = node.children, value,
                getter = valHooks["option:get"]
        index = ret ? index : node.selectedIndex
        singleton = ret ? singleton : node.type === "select-one" || index < 0
        ret = ret || []
        for (var i = 0, el; el = nodes[i++]; ) {
            if (!el.disabled) {
                switch (el.nodeName.toLowerCase()) {
                    case "option":
                        if ((el.selected || el.index === index)) {
                            value = getter(el)
                            if (singleton) {
                                return value
                            } else {
                                ret.push(value)
                            }
                        }
                        break
                    case "optgroup":
                        value = self(el, ret, index, singleton)
                        if (typeof value === "string") {
                            return value
                        }
                        break
                }
            }
        }
        return singleton ? null : ret
    },
    "select:set": function (node, values, optionSet) {
        values = [].concat(values) //强制转换为数组
        for (var i = 0, el; el = node.options[i++]; ) {
            if ((el.selected = values.indexOf(el.value) > -1)) {
                optionSet = true
            }
        }
        if (!optionSet) {
            node.selectedIndex = -1
        }
    }
}

/*******************************
 **************event**************
 ********************************/
