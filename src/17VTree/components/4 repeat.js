avalon.directive("repeat", {
    is: function (a, b) {
        if (Array.isArray(a)) {
            if (!Array.isArray(b)) {
                return false
            }
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
    init: function (binding) {
        var parent = binding.element
        disposeVirtual(parent.children)
        var component = new VComponent("ms-repeat")
        var template = toString(parent, /^ms-(repeat|each)/)
        var type = binding.type

        var signature = generateID(type)
        component.signature = signature

        component["data-" + type + "-rendered"] = parent.props["data-" + type + "-rendered"]
        component.children.length = 0 //将父节点作为它的子节点
        if (type === "repeat") {
            // repeat组件会替换旧原来的VElement
            var arr = binding.siblings
            for (var i = 0, el; el = arr[i]; i++) {
                if (el === parent) {
                    arr[i] = component
                    break
                }
            }
            component.template = template + "<!--" + signature + "-->"
        } else {
            //each组件会替换掉原VComponent组件的所有孩子
            disposeVirtual(parent.children)
            pushArray(parent.children, [component])
            component.template = parent.template.trim() + "<!--" + signature + "-->"
        }
        binding.element = component //偷龙转风
        //计算上级循环的$outer
        var top = binding.vmodel, $outer = {}, hasOuter
        if (top.hasOwnProperty("$itemName") && top.hasOwnProperty("$index")) {
            var outerEl = top.$itemName
            $outer[outerEl] = top[outerEl]
            $outer.$remove = top.$remove
            hasOuter = true
        } else if (top.hasOwnProperty("$key") && top.hasOwnProperty("$val")) {
            $outer.$key = top.$key
            $outer.$val = top.$val
            hasOuter = true
        }
        if (hasOuter) {
            $outer.$index = top.$index
            $outer.$first = top.$first
            $outer.$last = top.$last
        }
        binding.$outer = $outer
        delete binding.siblings
    },
    change: function (value, binding) {
        var parent = binding.element
        if (!parent || parent.disposed) {
            return
        }
        var cache = binding.cache || {}
        var newCache = {}, children = [], keys = [], command = {}, last, proxy
        var repeatArray = Array.isArray(value)
        if (repeatArray) {
            last = value.length - 1
        } else {
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    keys.push(key)
                }
            }
            last = keys.length - 1
        }

        //键名为它过去的位置
        //键值如果为数字,表示它将移动到哪里,-1表示它将移除,-2表示它将创建,-3不做处理
        for (var i = 0; i <= last; i++) {
            if (repeatArray) {
                var item = value[i]
                var component = isInCache(cache, item)
            } else {
                var key = keys[i]
                var item = value[key]
                component = cache[key]
                delete cache[key]
            }
            if (component) {
                proxy = component.vmodel
                if (proxy.$index !== i) {
                    command[proxy.$index] = i
                } else {
                    command[proxy.$index] = -3
                }
            } else {//如果不存在就创建 
                component = new VComponent("repeatItem")
                component.template = parent.template
                component.construct({
                    item: item,
                    host: value,
                    param: binding.param,
                    outer: binding.$outer,
                    vmodel: binding.vmodel
                })
                proxy = component.vmodel
                if (!repeatArray) {
                    proxy.$key = key
                }
                command[i] = -2
            }
            proxy.$index = i
            proxy.$first = i === 0
            proxy.$last = i === last
            if (component._new) {
                updateVirtual(component.children, proxy)
                delete component._new
            }
            if (repeatArray) {
                saveInCache(newCache, item, component)
            } else {
                newCache[key] = component
            }
            children.push(component)
        }
        for (i in cache) {//剩下的都是要删除重复利用的
            if (cache[i]) {
                command[cache[i].vmodel.$index] = -1
                cache[i].dispose()//销毁没有用的组件
                delete cache[i]
            }
        }

        parent.children.length = 0
        pushArray(parent.children, children)
        parent.children.unshift(new VComment(parent.signature + ":start"))
        parent.children.push(new VComment(parent.signature + ":end"))
        binding.cache = newCache
        if (repeatArray) {
            binding.oldValue = value.concat()
        } else {
            binding.oldValue = newCache
        }
        parent.repeatCommand = command

        addHooks(this, binding)
    },
    update: function (elem, vnode, parent) {
        if (!vnode.disposed) {
            var groupText = vnode.signature
            if (elem.nodeType !== 8 || elem.nodeValue !== groupText + ":start") {
                var dom = vnode.toDOM()
                var keepChild = avalon.slice(dom.childNodes)
                if (groupText.indexOf("each") === 0) {
                    avalon.clearHTML(parent)
                    parent.appendChild(dom)
                } else {
                    parent.replaceChild(dom, elem)
                }
                updateEntity(keepChild, getRepeatChild(vnode.children), parent)
                return false
            } else {
                var breakText = groupText + ":end"
                var fragment = document.createDocumentFragment()
                //将原有节点移出DOM, 试根据groupText分组
                var froms = {}, index = 0, next
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
                //根据repeatCommand指令进行删增重排
                var children = []
                for (var from in vnode.repeatCommand) {
                    var to = vnode.repeatCommand[from]
                    if (to >= 0) {
                        children[to] = froms[from]
                    } else if (to < -1) {//-2.-3
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
                    pushArray(virtual, el.children)
                })
                updateEntity(entity, virtual, parent)
                return false
            }
        }
        return false
    },
    old: function (binding, oldValue) {
        if (!Array.isArray(oldValue)) {
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

        var top = options.vmodel
        var item = options.item
        if (item && item.$id) {
            top = createProxy(top, item)
        }

        var proxy = createRepeatItem(top, options.host, options.param, item)
        proxy.$outer = options.outer
        this.vmodel = proxy
        this.children = createVirtual(this.template, true)
        this._new = true
        this.dispose = repeatItem.dispose
        return this
    },
    dispose: function () {
        this.disposed = true
        var proxy = this.vmodel
        var item = proxy[this.itemName]
        proxy.$active = false
        if (item) {
            item.$active = false
        }
    }
}

function createRepeatItem(curVm, array, param, item) {
    var heirloom = {}
    var before = Object(curVm) === curVm ? curVm : {}
    var after = {
        $accessors: {
            $first: makeObservable("$first", heirloom),
            $last: makeObservable("$last", heirloom),
            $index: makeObservable("$index", heirloom)
        },
        $outer: 1
    }
    if (Array.isArray(array)) {
        param = param || "el"
        after.$itemName = param
        after.$remove = function () {
            avalon.Array.remove(array, curVm)
        }
        after.$accessors[param] = makeObservable(param, heirloom)
    } else {
        after.$key = ""
        after.$accessors.$val = makeObservable("$val", heirloom)
    }
    if (Object.defineProperties) {
        Object.defineProperties(after, after.$accessors)
    }
    var proxy = createProxy(before, after, heirloom)
    if (Array.isArray(array)) {
        proxy[param] = item
    } else {
        proxy.$val = item
    }
    return proxy
}
function getRepeatChild(children) {
    var ret = []
    for (var i = 0, el; el = children[i++]; ) {
        if (el.__type__ === "repeatItem") {
            pushArray(ret, el.children)
        } else {
            ret.push(el)
        }
    }
    return ret
}

avalon.directives.each = avalon.directives.repeat
avalon.components["ms-each"] = avalon.components["ms-repeat"]


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
