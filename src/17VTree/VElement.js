function VElement(type, props, template) {
    this.type = type
    this.template = ""
    this.children = []
    this.props = {}

    if (typeof props === "string") {
        parseVProps(this, props)
    } else if (props && typeof props === "object") {
        this.props = props
    }
    if (rmsskip.test(props)) {
        this.skipContent = true
    } else if (typeof template === "string") {
        if (this.type === "option" || this.type === "xmp") {
            this.children.push(new VText(template))
        } else if (rnocontent.test(this.type)) {
            if (this.type === "noscript") {
                template = escape(innerHTML)
            }
            this.skipContent = true
        } else {//script, noscript, template, textarea
            pushArray(this.children, createVirtual(template))
        }
    } else if (Array.isArray(template)) {
        pushArray(this.children, template)
    }
    
    if (typeof template === "string") {
        this.template = template
    }
    
}
VElement.prototype = {
    constructor: VElement,
    toDOM: function () {
        var dom = document.createElement(this.type)
        for (var i in this.props) {
            if (this.props[i] === false) {
                dom.removeAttribute(i)
            } else {
                dom.setAttribute(i, String(this.props[i]))
            }
        }
        if (this.skipContent) {
            switch (this.type) {
                case "script":
                    this.text = this.template
                    break;
                case "style":
                case "template":
                    this.innerHTML = this.template
                    break
                case "noscript":
                    this.textContent = this.template
                    break
                default:
                    var a = avalon.parseHTML(this.template)
                    dom.appendChild(a)
                    break
            }
        } else {
            this.children.forEach(function (c) {
                dom.appendChild(c.toDOM())
            })
            if (!this.children.length) {
                a = avalon.parseHTML(this.template)
                dom.appendChild(a)
            }
        }
        return dom
    },
    toHTML: function () {
        var arr = []
        for (var i in this.props) {
            arr.push(i + "=" + quote(String(this.props[i])))
        }
        arr = arr.length ? " " + arr.join(" ") : ""
        var str = "<" + this.type + arr
        if (this.closeSelf) {
            return str + "/>"
        }
        str += ">"
        if (this.skipContent) {
            str += this.template
        } else {
            str += this.children.map(function (el) {
                return el.toHTML()
            }).join("")
        }
        return str + "</" + this.type + ">"
    }
}

function toString(element, skip) {
    var p = []
    for (var i in element.props) {
        if (skip && skip.test(i))
            continue
        p.push(i + "=" + quote(String(element.props[i])))
    }
    p = p.length ? " " + p.join(" ") : ""

    var str = "<" + element.type + p
    if (element.selfClose) {
        return str + "/>"
    }
    str += ">"

    str += element.template

    return str + "</" + element.type + ">"
}
//从元素的开标签中一个个分解属性值
var rattr2 = /\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
//判定是否有引号开头，IE有些属性没有用引号括起来
var rquote = /^['"]/
var ramp = /&amp;/g
var rmsskip = /\bms\-skip/
//内部不存在元素节点的元素
var rnocontent = /textarea|template|script|style/

function parseVProps(node, str) {
    var props = node.props, change

    str.replace(rattr2, function (a, n, v) {
        if (v) {
            v = (rquote.test(v) ? v.slice(1, -1) : v).replace(ramp, "&")
        }
        var name = n.toLowerCase()
        var match = n.match(rmsAttr)
        if (match) {
            var type = match[1]
            switch (type) {
                case "controller":
                case "important":
                    change = addData(node, "changeAttrs")
                    //移除ms-controller, ms-important
                    //好让[ms-controller]样式生效,处理{{}}问题
                    change[name] = false
                    name = "data-" + type
                    //添加data-controller, data-controller
                    //方便收集vmodel
                    change[name] = v
                    addAttrHook(node)
                    break
                case "with":
                    change = addData(node, "changeAttrs")
                    change[name] = false
                    addAttrHook(node)
                    name = "each"
                    break
            }
        }
        props[name] = v || ""
    })

    return props
}






