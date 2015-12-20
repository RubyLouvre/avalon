avalon.components["ms-repeat"] = {
    construct: function (parent) {

        var self = this

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
        virtual.__type__ = "1"
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
        virtual.__type__ = "1"
        var html = virtual.toHTML()
        virtual.__type__ = type
        var start = "<!--" + virtual.signature + "-start-->"
        var end = "<!--" + virtual.signature + "-end-->"
        return start + html + end
    },
    init: Ifcom.init
}
//   A, B, C
// ---> A C

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
        var parent = binding.element

        if (Array.isArray(value)) {
            var oldValue = binding.oldValue || []
            // var diff = new ArraySplice()
            var children = parent.children
            var cache = {}
            for (var i = 0; i <= last; i++) {
                var vm = value[i]
                if (Object(vm) === vm) {
                    cache[vm.$id] = vm
                } else {
                    var id = avalon.type(vm) + "_" + vm
                    if (cache[id]) {
                        cache[id + "_"] = vm
                    } else {
                        cache[id] = vm
                    }

                }
            }



            // var splices = diff.calculateSplices(value, oldValue)
            // var reuseComponents = []
            console.log(splices)
            for (var i = 0, el; el = splices[i++]; ) {
                var index = el.index
                reuseComponents = children.splice(index, el.removed.length)

                var args = value.slice(index, index + el.addedCount)

                args = args.map(function (el) {
                  

                    var component = reuseComponents.shift()
                    if (component) {
                        component.updateProxy({
                            vm: el
                        })
                        return component
                    }
                    component = new VComponent("repeatItem", {})
                    component.outerHTML = parent.props.template
                    component.itemName = binding.itemName
                    component.construct({vm: el})
                    return component
                })
                args.unshift(index, 0)
                children.splice.apply(children, args)
            }
        }
        children.forEach(function (el, index) {
            var vm = el.props.vm
            vm.$index = index
            vm.$first = index === 0
            vm.$last = index === last
            if (el["new"]) {
                updateVirtual(el.children, vm)
                delete el["new"]
            }

        })
        binding.oldValue = value.concat()
        console.log(binding.oldValue)
        console.log(parent.toHTML())

//        var change = addHooks(binding.element, "changeHooks")
//        change.repeat = this.update
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
            // binding.oldValue = oldValue.concat()
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

var repeatItem = avalon.components["repeatItem"] = {
    construct: function (options) {
        var vm = createRepeatItem(options.vm, this.itemName)
        vm[this.itemName] = options.vm
        this.props.vm = vm
        this.children = createVirtual(this.outerHTML, true)
        this["new"] = true
        //  updateVirtual(this.children, vm)
        this.updateProxy = repeatItem.updateProxy
        return this
    },
    updateProxy: function (options) {
        var vm = this.props.vm
        vm[this.itemName] = options.vm
        for (var i in options.vm) {
            vm[i] = options.vm[i]
        }


    }
}

function createRepeatItem(curVm, itemName) {
    var heirloom = {}
    var after = {
        $accessors: {
            $first: makeObservable("first", heirloom),
            $last: makeObservable("$last", heirloom),
            $index: makeObservable("$index", heirloom)
        },
        $first: 1,
        $last: 1,
        $index: 1,
        $remove: function () {

        }
    }
    after[itemName] = 1
    after.$accessors[itemName] = makeObservable(itemName, heirloom)
    var proxy = createProxy(Object(curVm) === curVm ? curVm : {}, after, heirloom)
    return proxy
}

avalon.test.createRepeatItem = createRepeatItem

avalon.components["ms-each"] = avalon.components["ms-repeat"]

function removeItems(array) {
    array.forEach(function (el) {
        el.$active = false
    })
}
