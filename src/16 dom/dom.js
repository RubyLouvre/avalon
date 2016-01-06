/*********************************************************************
 *                  avalon的原型方法定义区                             *
 **********************************************************************/

function hyphen(target) {
    //转换为连字符线风格
    return target.replace(/([a-z\d])([A-Z]+)/g, "$1-$2").toLowerCase()
}

function camelize(target) {
    //提前判断，提高getStyle等的效率
    if (!target || target.indexOf("-") < 0 && target.indexOf("_") < 0) {
        return target
    }
    //转换为驼峰风格
    return target.replace(/[-_][^-_]/g, function (match) {
        return match.charAt(1).toUpperCase()
    })
}

var fakeClassListMethods = {
    _toString: function () {
        var node = this.node
        var cls = node.className
        var str = typeof cls === "string" ? cls : cls.baseVal
        return str.split(/\s+/).join(" ")
    },
    _contains: function (cls) {
        return (" " + this + " ").indexOf(" " + cls + " ") > -1
    },
    _add: function (cls) {
        if (!this.contains(cls)) {
            this._set(this + " " + cls)
        }
    },
    _remove: function (cls) {
        this._set((" " + this + " ").replace(" " + cls + " ", " "))
    },
    __set: function (cls) {
            cls = cls.trim()
            var node = this.node
            if (rsvg.test(node)) {
                //SVG元素的className是一个对象 SVGAnimatedString { baseVal="", animVal=""}，只能通过set/getAttribute操作
                node.setAttribute("class", cls)
            } else {
                node.className = cls
            }
        } //toggle存在版本差异，因此不使用它
}

function fakeClassList(node) {
    if (!("classList" in node)) {
        node.classList = {
            node: node
        }
        for (var k in fakeClassListMethods) {
            node.classList[k.slice(1)] = fakeClassListMethods[k]
        }
    }
    return node.classList
}


"add,remove".replace(rword, function (method) {
    avalon.fn[method + "Class"] = function (cls) {
        var el = this[0]
            //https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/26
        if (cls && typeof cls === "string" && el && el.nodeType === 1) {
            cls.replace(/\S+/g, function (c) {
                fakeClassList(el)[method](c)
            })
        }
        return this
    }
})
avalon.fn.mix({
    hasClass: function (cls) {
        var el = this[0] || {}
        return el.nodeType === 1 && fakeClassList(el).contains(cls)
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
            }
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

function parseData(data) {
    try {
        if (typeof data === "object")
            return data
        data = data === "true" ? true :
            data === "false" ? false :
            data === "null" ? null : +data + "" === data ? +data : rbrace.test(data) ? avalon.parseJSON(data) : data
    } catch (e) {}
    return data
}
var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
    rvalidchars = /^[\],:{}\s]*$/,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g
avalon.parseJSON = window.JSON ? JSON.parse : function (data) {
    if (typeof data === "string") {
        data = data.trim();
        if (data) {
            if (rvalidchars.test(data.replace(rvalidescape, "@")
                    .replace(rvalidtokens, "]")
                    .replace(rvalidbraces, ""))) {
                return (new Function("return " + data))() // jshint ignore:line
            }
        }
        avalon.error("Invalid JSON: " + data)
    }
    return data
}

avalon.fireDom = function (elem, type, opts) {
    if (DOC.createEvent) {
        var hackEvent = DOC.createEvent("Events");
        hackEvent.initEvent(type, true, true, opts)
        avalon.mix(hackEvent, opts)

        elem.dispatchEvent(hackEvent)
    } else if (root.contains(elem)) {//IE6-8触发事件必须保证在DOM树中,否则报"SCRIPT16389: 未指明的错误"
        hackEvent = DOC.createEventObject()
        avalon.mix(hackEvent, opts)
        elem.fireEvent("on" + type, hackEvent)
    }
}


//==================================val相关============================

