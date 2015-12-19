function VComponent(type, props, children) {
    this.type = "#component"
    this.props = props
    this.__type__ = type
    this.children = children || []
}
VComponent.prototype = {
    construct: function (parent) {
        var me = avalon.components[this.__type__]
        if (me && me.construct) {
            return me.construct(this, parent)
        } else {
            return this
        }
    },
    init: function (vm) {
        var me = avalon.components[this.__type__]
        if (me && me.init) {
            me.init(this, vm)
        }
    },
    toDOM: function () {
        var me = avalon.components[this.__type__]
        if (me && me.toDOM) {
            return me.toDOM(this)
        }
        var fragment = document.createDocumentFragment()
        for (var i = 0; i < this.children.length; i++) {
            fragment.appendChild(this.children[i].toDOM())
        }
        return fragment
    },
    toHTML: function () {
        var me = avalon.components[this.__type__]
        if (me && me.toHTML) {
            return me.toHTML(this)
        }
        var ret = ""
        for (var i = 0; i < this.children.length; i++) {
            ret += this.children[i].toHTML()
        }
        return ret
    }
}

avalon.components = {}

var Ifcom = avalon.components["ms-if"] = {
    construct: function (self, parent) {
        parent.children = createVirtual(parent.innerHTML, true)
        self._children = [parent] //将父节点作为它的子节点
        return self
    },
    init: function (me, vm) {
        var binding = {
            type: me.__type__.replace(/^ms-/, ""),
            expr: me.props.expr,
            vmodel: vm,
            element: me
        }
        avalon.injectBinding(binding)
    }
}



avalon.components["ms-repeat"] = {
    construct: function (self, parent) {
        disposeVirtual(parent.children)
        var type = self.__type__.replace("ms-", "")
        var signature = generateID(type)
        self.signature = signature
        self["data-" + type + "-rendered"] = parent["data-" + type + "-rendered"]
        self.children = [] //将父节点作为它的子节点
        if (type === "each") {
            self.props.template = parent.innerHTML.trim() + "<!--" + signature + "-->"
            parent.children = [self]
            return parent
        }
        delete parent.props["avalon-uuid"]
        self.props.template = parent.toHTML() + "<!--" + signature + "-->"
        return self
    },
    toDOM: function (virtual) {
        var type = virtual.__type__
        virtual.__type__ = new Date - 0
        var dom = virtual.toDOM()
        virtual.__type__ = type

        var start = document.createComment(virtual.signature + "-start")
        var end = document.createComment(virtual.signature + "-end")

        dom.insertBefore(start, dom.firstChild)
        dom.appendChild(end)
        return dom
    },
    toHTML: function (virtual) {
        var type = virtual.__type__
        virtual.__type__ = new Date - 0
        var html = virtual.toHTML()
        virtual.__type__ = type
        var start = "<!--" + virtual.signature + "-start-->"
        var end = "<!--" + virtual.signature + "-end-->"
        return start + html + end
    },
    init: Ifcom.init
}
function compareObject(a, b) {

    var atype = avalon.type(a)
    var btype = avalon.type(a)
    if (atype === btype) {
        var aisVM = atype === "object" && a.$id
        var bisVM = btype === "object"
        var hasDetect = {}
        if (aisVM && bisVM) {
            for (var i in a) {
                hasDetect[i] = true
                if ($$skipArray[i])
                    continue
                if (a.hasOwnProperty(i)) {
                    if (!b.hasOwnProperty(i))
                        return false //如果a有b没有
                    if (!compareObject(a[i], b[i]))
                        return false
                }
            }
            for (i in b) {
                if (hasDetect[i]) {
                    continue
                }//如果b有a没有
                return false
            }
            return true
        } else {
            if (btype === "date")
                return a + 0 === b + 0
            return a === b
        }
    } else {
        return false
    }
}


avalon.directive("repeat", {
    is: function (a, b) {
        if (Array.isArray(a)) {

            if (!Array.isArray(b))
                return false
            if (a.length !== b.length) {
                return false
            }

            return !a.some(function (el, i) {
                return el !== b[i]
            })
        } else {
            return compareObject(a, b)
        }
    },
    change: function (value, binding) {
        var last = value.length - 1
        var proxies = []
        for (var i = 0; i < value.length; i++) {
            var heirloom = {}
            var curVm = value[i]
            var after = {
                $accessors: {
                    $first: makeObservable(0, heirloom),
                    $last: makeObservable(0, heirloom),
                    $index: makeObservable(0, heirloom),
                    el: makeObservable(0, heirloom)
                },
                $first: 1,
                $last: 1,
                $index: 1,
                el: 1,
                $remove: function () {

                }
            }
            var proxy = createProxy(Object(curVm) === curVm ? curVm : {}, after)
            proxy.$first = i === 0
            proxy.$last = i === last
            proxy.$index = i
            proxy.el = value[i]
            proxies.push(proxy)
            var node = createVirtual(binding.element.props.template, true)
            updateVirtual(node, proxy)
            binding.element.children[i] = new VComponent("repeatItem", {}, node)
        }
        var change = addHooks(binding.element, "changeHooks")
        change.repeat = this.update
    },
    update: function (elem, vnode) {
        var parent = elem.parentNode, next
        if (parent) {
            var dom = vnode.toDOM()
            if (elem.nodeType !== 8) {
                parent.replaceChild(dom, elem)
            } else {
                while (next = elem.nextSibling) {
                    if (next.nodeValue === dom.lastChild.nodeValue) {
                        parent.removeChild(next)
                        break
                    } else {
                        parent.removeChild(next)
                    }
                }
                parent.replaceChild(dom, elem)
            }

        }
    },
    old: function (binding, oldValue) {
        if (Array.isArray(oldValue)) {
            binding.oldValue = oldValue.concat()
        } else {
            var o = binding.oldValue = {}
            for (var i in oldValue) {
                if (oldValue.hasOwnProperty(i)) {
                    o[i] = oldValue[i]
                }
            }
        }
    }
})


avalon.components["ms-each"] = avalon.components["ms-repeat"]

avalon.directive("if", {
    is: function (a, b) {
        if (b === void 0)
            return false
        return Boolean(a) === Boolean(b)
    },
    change: function (value, binding) {
        var elem = binding.element
        if (elem) {
            var change = addHooks(elem, "changeHooks")
            change["if"] = this.update
            elem.state = !!value
            disposeVirtual(elem.children)
            if (value) {
                elem.children = updateVirtual(elem._children, binding.vmodel)
            } else {
                elem.children = [new VComment("ms-if")]
            }
        }
    },
    update: function (elem, vnode) {
        var replace = false
        if (vnode.state) {
            replace = elem.nodeType === 8
        } else {
            replace = elem.nodeType === 1
        }
        if (replace) {
            var dom = vnode.toDOM()
            elem.parentNode.replaceChild(dom, elem)
        }
    }
})

avalon.components["ms-html"] = {
    construct: function (self, parent) {
//替换父节点的所有孩子
        parent.children = [self]
        return parent
    },
    init: Ifcom.init
}

avalon.directive("html", {
    change: function (value, binding) {
        var elem = binding.element
        if (elem) {
            value = typeof value === "string" ? value : String(value)
            disposeVirtual(elem.children)
            var children = createVirtual(value, true)
            elem.children = updateVirtual(children, binding.vmodel)
            var change = addHooks(elem, "changeHooks")
            change.html = this.update
        }
    },
    update: function (elem, vnode) {
        var parent = elem.parentNode
        avalon.clearHTML(parent)
        parent.appendChild(vnode.toDOM())
    }
})


avalon.components["ms-text"] = {
    construct: function (self, parent) {
//替换父节点的所有孩子
        parent.children = [self]
        return parent
    },
    init: Ifcom.init
}


avalon.directive("text", {
    change: function (value, binding) {
        var elem = binding.element
        if (elem) {
            value = typeof value === "string" ? value : String(value)
            disposeVirtual(elem.children)
            var children = [new VText(value)]
            elem.children = updateVirtual(children, binding.vmodel)
            var change = addHooks(elem, "changeHooks")
            change.text = this.update
        }
    },
    update: function (elem, vnode) {
        var parent = elem.parentNode
        if (!parent)
            return
        if ("textContent" in parent) {
            elem.textContent = vnode.toHTML()
        } else {
            elem.innerText = vnode.toHTML()
        }
    }
})
