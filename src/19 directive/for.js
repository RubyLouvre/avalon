var rinexpr = /^\s*([\s\S]+) in (\w+)/
var rkeyvalue = /\(\s*(\w+)\s*,\s*(\w+)\s*\)/
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
        var expr = binding.expr, match
        if (match = expr.match(rinexpr)) {
            binding.expr = match[2]
            var keyvalue = match[1]
            if (match = keyvalue.match(rkeyvalue)) {
                binding.keyName = match[1]
                binding.valueName = match[2]
            } else {
                binding.valueName = keyvalue
            }
        }
        var parent = binding.element
        disposeVirtual(parent.children)
        var component = new VComponent("ms-repeat")
        var template = toString(parent, /^ms-(repeat|each)/)
        var type = binding.type
        var top = binding.vmodel, $outer = {}
        var signature = generateID(type)
        component.signature = signature
        var rendered = getBindingValue(parent, "data-" + type + "-rendered", top)
        if (typeof rendered === "function") {
            binding.rendered = function (a, b, c) {
                rendered(type === "repeat" ? c : a)
            }
        } else {
            binding.rendered = noop
        }
        component.children.length = 0 //将父节点作为它的子节点
        if (type === "repeat") {
            // repeat组件会替换旧原来的VElement
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
        //外层存在的vmodel不存在$outer,那么$outer为一个空对象

        if (top.hasOwnProperty("$outer") && typeof top.$outer === "object" && top.$outer.names) {
            top.$outer.names.replace(rword, function (name) {
                if (top.hasOwnProperty(name)) {
                    $outer[name] = top[name]
                }
            })
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
            if (!binding.valueName) {
                binding.valueName = binding.param || "el"
                delete binding.param
            }
            if (!binding.keyName) {
                binding.keyName = "$index"
            }
        } else {
            if (!binding.keyName) {
                binding.keyName = "$key"
            }
            if (!binding.valueName) {
                binding.valueName = "$val"
            }
            for (var k in value) {
                if (value.hasOwnProperty(k)) {
                    keys.push(k)
                }
            }
            last = keys.length - 1
        }
        if (!binding.$outer.names) {
            var names = ["$first", "$last", "$index", "$outer"]
            if (repeatArray) {
                names.push("$remove")
            }
            avalon.Array.ensure(names, binding.valueName)
            avalon.Array.ensure(names, binding.keyName)
            binding.$outer.names = names.join(",")
        }


        //键值如果为数字,表示它将移动到哪里,-1表示它将移除,-2表示它将创建,-3不做处理
        //只遍历一次算出所有要更新的步骤 O(n) ,比kMP (O(m+n))快
        for (var i = 0; i <= last; i++) {
            if (repeatArray) {//如果是数组,以$id或type+值+"_"为键名
                var item = value[i]
                var component = isInCache(cache, item)//从缓存取出立即删掉
            } else {//如果是对象,直接用key为键名
                var key = keys[i]
                item = value[key]
                component = cache[key]
                delete cache[key]
            }
            if (component) {
                proxy = component.vmodel
                if (proxy.$index !== i) {
                    command[proxy.$index] = i//发生移动
                } else {
                    command[proxy.$index] = i //-3
                }
            } else {//如果不存在就创建 
                component = new VComponent("repeatItem")
                component.template = parent.template
                component.construct(item, binding, repeatArray)
                proxy = component.vmodel
                proxy.$outer = binding.$outer
                proxy[binding.keyName] = key || i
                proxy[binding.valueName] = item
                if (repeatArray) {
                    /* jshint ignore:start */
                    (function (array, el) {
                        proxy.$remove = function () {
                            avalon.Array.remove(array, el)
                        }
                    })(value, item)
                    /* jshint ignore:end */
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
        for (i in cache) {
            if (cache[i]) {
                var ii = cache[i].vmodel.$index
                if (command[ii] === -2) {
                    command[ii] = -3
                } else {
                    command[ii] = -1
                }
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
        addHook(parent, binding.rendered, "afterChange", 95)
        addHooks(this, binding)
    },
    update: function (elem, vnode, parent) {
        if (!vnode.disposed) {
            vnode.entity = elem
            console.log(avalon.$$subscribers.length)
            var groupText = vnode.signature
            var nodeValue = elem.nodeValue
            if (elem.nodeType === 8 && /\w+\d+\:start/.test(nodeValue) &&
                    nodeValue !== groupText + ":start"
                    ) {
                console.log(vnode)
                updateSignature(elem, nodeValue, groupText)
            }

            if (elem.nodeType !== 8 || elem.nodeValue !== groupText + ":start") {
                // console.log("全新创建 ",elem,groupText, parent.nodeName)
                var dom = vnode.toDOM()

                var keepChild = avalon.slice(dom.childNodes)
                if (groupText.indexOf("each") === 0) {
                    avalon.clearHTML(parent)
                    parent.appendChild(dom)
                } else {
                    parent.removeChild(elem.nextSibling)
                    parent.replaceChild(dom, elem)
                }
                updateEntity(keepChild, getRepeatChild(vnode.children), parent)
                return false
            } else {
                // console.log("最小化更新 ",parent.nodeName)
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

                        if (froms[from]) {
                            children[from] = froms[from]
                        } else {
                            // console.log("创建")
                            children[from] = vnode.children[from].toDOM()
                        }
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

function updateSignature(elem, value, text) {
    var group = value.split(":")[0]
    do {
        var nodeValue = elem.nodeValue
        if (elem.nodeType === 8 && nodeValue.indexOf(group) === 0) {
            elem.nodeValue = nodeValue.replace(group, text)
            if (nodeValue.indexOf(":last") > 0) {
                break
            }
        }
    } while (elem = elem.nextSibling)
}

var repeatItem = avalon.components["repeatItem"] = {
    construct: function (item, binding, isArray) {
        var top = binding.vmodel
        if (item && item.$id) {
            top = createProxy(top, item)
        }
        var keys = [binding.keyName, binding.valueName, "$index", "$first", "$last"]
        this.valueName = binding.valueName
        var proxy = createRepeatItem(top, keys, isArray)
        this.vmodel = proxy
        this.children = createVirtual(this.template, true)
        this._new = true
        this.dispose = repeatItem.dispose
        return this
    },
    dispose: function () {
        disposeVirtual([this])
        var proxy = this.vmodel
        var item = proxy[this.valueName]
        proxy && (proxy.$active = false)
        if (item && item.$id) {
            item.$active = false
        }
    }
}



function createRepeatItem(before, keys, isArray) {
    var heirloom = {}
    var after = {
        $accessors: {},
        $outer: 1
    }
    for (var i = 0, key; key = keys[i++]; ) {
        after.$accessors[key] = makeObservable(key, heirloom)
    }
    if (isArray) {
        after.$remove = noop
    }
    if (Object.defineProperties) {
        Object.defineProperties(after, after.$accessors)
    }

    return createProxy(before, after, heirloom)
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