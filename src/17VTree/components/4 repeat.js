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

        var start = document.createComment(virtual.signature + ":start")
        var end = document.createComment(virtual.signature + ":end")

        dom.insertBefore(start, dom.firstChild)
        dom.appendChild(end)
        return dom
    },
    toHTML: function (virtual) {
        var type = virtual.__type__
        virtual.__type__ = "1"
        var html = virtual.toHTML()
        virtual.__type__ = type
        var start = "<!--" + virtual.signature + ":start-->"
        var end = "<!--" + virtual.signature + ":end-->"
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
function isInCache(cache, vm) {
    var isObject = Object(vm) === vm, c
    if (isObject) {
        c = cache[vm.$id]
        if (c) {
            delete cache[vm.$id]
        }
        return c
    } else {
        var id = avalon.type(vm) + "_" + vm
        c = cache[id]
        if (c) {
            var stack = [{id: id, c: c}]
            while (1) {
                id += "_"
                if (cache[id]) {
                    stack.push({
                        id: id,
                        c: cache[id]
                    })
                } else {
                    break
                }
            }
            var a = stack.pop()
            delete cache[a.id]
            return a.c
        }
        return c
    }
}

function saveInCache(cache, vm, component) {
    if (Object(vm) === vm) {
        cache[vm.$id] = component
    } else {
        var type = avalon.type(vm)
        var trackId = type + "_" + vm
        if (!cache[trackId]) {
            cache[trackId] = component
        } else {
            while (1) {
                trackId += "_"
                if (!cache[trackId]) {
                    cache[trackId] = component
                    break
                }
            }
        }
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
    /*
     var cache = {
     string_abc:  "abc",
     string_abc_: "abc",
     string_abc__:"abc"
     }
     */
    change: function (value, binding) {

        var parent = binding.element
        var cache = binding.cache || {}
        var newCache = {}
        var children = []
        var last = value.length - 1
        //遍历监控数组的VM或简单数据类型
        var needDispose = [], proxy
        var command = {}
        //键名为它过去的位置
        //键值如果为数字,表示它将移动到哪里,-1表示它将移除,-2表示它将创建,-3不做处理
        for (var i = 0; i <= last; i++) {
            var vm = value[i]
            var component = isInCache(cache, vm)

            if (component) {
                console.log(component.index, vm)
                proxy = component.props.vm
                if (proxy.$index !== i) {
                    command[proxy.$index] = i
                } else {
                    command[proxy.$index] = -3
                }
            } else {
                component = new VComponent("repeatItem", {})
                component.outerHTML = parent.props.template
                component.itemName = binding.itemName
                component.construct({vm: vm, top: binding.vmodel})
                component.index = i
                proxy = component.props.vm
                command[i] = -2
            }
            proxy.$index = i
            proxy.$first = i === 0
            proxy.$last = i === last
            if (component._new) {
                updateVirtual(component.children, proxy)
                delete component._new
            }
            saveInCache(newCache, vm, component)
            children.push(component)
        }


        for (i in cache) {//剩下的都是要删除重复利用的
            if (cache[i]) {
                command[cache[i].props.vm.$index] = -1
                needDispose.push(cache[i])
                delete cache[i]
            }
        }
        disposeVirtual(needDispose)
        parent.children = children
        binding.cache = newCache

        binding.oldValue = value.concat()
        // console.log(binding)
        //  console.log(parent.toHTML())

        var change = addHooks(parent, "changeHooks")
        parent.repeatCommand = command
        change.repeat = this.update
    },
    update: function (elem, vnode) {
        var parent = elem.parentNode, next
        if (parent) {
            var dom = vnode.toDOM()
            if (elem.nodeType !== 8) {
                parent.replaceChild(dom, elem)
            } else {

                var groupText = elem.nodeValue.replace(":start", "")
                var breakText = groupText + ":end"
                //  [1, 2, 3, 4]
                //  [4, 3, 2, 1]
                var fragment = document.createDocumentFragment()

                var froms = {}
                var index = 0
                while (next = elem.nextSibling) {
                    if (next.nodeValue === breakText) {
                        break
                    } else if (next.nodeValue === groupText) {
                        fragment.appendChild(next)
                        froms[index] = fragment
                        index++
                        fragment = document.createDocumentFragment()
                    } else {
                        fragment.appendChild(next)
                    }
                }
                var children = []
                for (var from in vnode.repeatCommand) {
                    var to = vnode.repeatCommand[from]
                    if (to >= 0) {
                        children[to] = froms[from]
                    } else if (to === -3) {
                        children[from] = froms[from]
                    }
                }
                fragment = document.createDocumentFragment()
                for (var i = 0, el; el = children[i++]; ) {
                    fragment.appendChild(el)
                }
                var entity = avalon.slice(fragment.childNodes)
                elem.parentNode.insertBefore(fragment, elem.nextSibling)
                var virtual = []
                vnode.children.forEach(function (el) {
                    virtual = virtual.concat(el.children)
                })
                updateEntity(entity, virtual)
                //console.log(vnodes)

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
        var top = options.top
        if (options.vm && options.vm.$id) {
            top = createProxy(top, options.vm)
        }

        var vm = createRepeatItem(top, this.itemName)
        vm[this.itemName] = options.vm
        this.props.vm = vm
        this.children = createVirtual(this.outerHTML, true)
        this._new = true
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
    var before = Object(curVm) === curVm ? curVm : {}
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
    var proxy = createProxy(before, after, heirloom)
    return proxy
}

//avalon.test.createRepeatItem = createRepeatItem

avalon.components["ms-each"] = avalon.components["ms-repeat"]

function removeItems(array) {
    array.forEach(function (el) {
        el.$active = false
    })
}
