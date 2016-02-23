var rinexpr = /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?\s*$/
var rkeyvalue = /\(\s*(\w+)\s*,\s*(\w+)\s*\)/
var rremoveRepeat = /^(?:ms|av)-(repeat|each)/
var addHook = require("../vdom/hooks").addHook
var addHooks = require("../vdom/hooks").addHooks
var scanNodes = require("../scan/scanNodes")
var getBindingValue = require("./var/getBindingValue")

var vars = require("../base/builtin")
var pushArray = vars.pushArray
var noop = vars.noop
var rword = vars.rword
var makeHashCode = vars.makeHashCode
var shimTemplate = require("../vdom/shimTemplate")
var VComponent = require("../vdom/VComponent")
var VComment = require("../vdom/VComment")
var factory = require("../model/compact")
var batchUpdateEntity = require("../strategy/batchUpdateEntity")

var makeComputed = require("../model/builtin").makeComputed


var $$skipArray = require("../model/skipArray.compact")
var $emit = require("../model/dispatch").$emit

var makeObservable = factory.makeObservable
var mediatorFactory = factory.mediatorFactory

var updateEntity = require("../strategy/updateEntity")
var createVirtual = require("../strategy/createVirtual")
var disposeVirtual = require("../strategy/disposeVirtual")

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
            if (!b)
                return false
            return compareObject(a, b)
        }
    },
    init: function (binding) {
        //尝试使用ng风格的 el in array或(index, el) in array
        var expr = binding.expr, match
        if (match = expr.match(rinexpr)) {
            binding.expr = match[2]
            var keyvalue = match[1]
            if (match = keyvalue.match(rkeyvalue)) {
                binding.keyName = match[1]
                binding.itemName = match[2]
            } else {
                binding.itemName = keyvalue
            }
        }

        var vnode = binding.element

        //disposeVirtual(vnode.children)// ms-each已经做了, ms-repeat直接disposed

        var template = shimTemplate(vnode, rremoveRepeat) //防止死循环
        var type = binding.type
        var component = new VComponent({
            type: "ms-" + type,
            props: {
                spec: type
            },
            children: [],
            components: [],
            template: type === "repeat" ? template : vnode.template.trim()
        })

        var top = binding.vmodel, $outer = {}

        //处理渲染完毕后的回调的函数
        var rendered = getBindingValue(vnode, "data-" + type + "-rendered", top)
        if (typeof rendered === "function") {
            binding.rendered = function (a, b, c) {
                rendered(type === "repeat" ? c : a)
            }
        } else {
            binding.rendered = noop
        }

        if (type === "repeat") {
            // repeat组件会替换旧原来的VElement
            var arr = binding.siblings
            for (var i = 0, el; el = arr[i]; i++) {
                if (el === vnode) {
                    arr[i] = component
                    vnode.disposed = true
                    break
                }
            }
        } else {
            //each组件会替换掉原VComponent组件的所有孩子
            disposeVirtual(vnode.children)
            pushArray(vnode.children, [component])
        }

        binding.element = component //偷龙转风
        //计算上级循环的$outer
        //外层vmodel不存在$outer对象时, $outer为一个空对象
        if (top.hasOwnProperty("$outer") && typeof top.$outer === "object" && top.$outer.names) {
            top.$outer.names.replace(rword, function (name) {
                if (top.hasOwnProperty(name)) {
                    $outer[name] = top[name]
                }
            })
        }
        binding.initNames = initNames
        binding.$outer = $outer
        delete binding.siblings
        return false
    },
    change: function (value, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed) {
            return
        }
        if (avalon.repeatCount) {
            avalon.repeatCount++
        } else {
            avalon.repeatCount = 1
        }

        var cache = binding.cache || {}
        var newCache = {}, keys = [], last
        //处理keyName, itemName, last

        var repeatArray = Array.isArray(value)
        binding.initNames(repeatArray)
        if (repeatArray) {
            last = value.length - 1
        } else {
            for (var k in value) {
                if (value.hasOwnProperty(k)) {
                    keys.push(k)
                }
            }
            last = keys.length - 1
        }
        //第一次循环,从cache中重复利用虚拟节点及对应的代理VM, 没有就创建空的虚拟节点
        var components = {}
        var entries = []
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
            entries.push({
                key: key || i,
                item: item
            })
            if (component !== void 0) {
                components[i] = component
            }
        }
        var reuse = []//回收剩下的虚拟节点
        for (i in cache) {
            reuse.push(cache[i])
            delete cache[i]
        }
        //第二次循环,创建缺失的虚拟节点或proxy
        var now = new Date
        var newCom
        var createTime = 0
        var asignTime = 0
        for (i = 0; i <= last; i++) {
            component = components[i]
            var curItem = entries[i].item
            var curKey = entries[i].key
            if (component) {//排序时进此分支
                var proxy = component.vmodel
                component.oldIndex = proxy.$index
                //command[i] = proxy.$index//获取其现在的位置

            } else {//增删改时进这分支
                component = reuse.shift()//重复利用回收的虚拟节点
                if (!component) {// 如果是splice走这里
                    component = new RepeatItem(vnode.copy)
                    newCom = true
                }

                if (component.item !== curItem) {
                    vnode.updateChildren = true
                }

                component.value = value
                component.key = curKey

                //新建或重利用旧的proxy, item创建一个proxy
                var atime = new Date - 0
                proxy = repeatItemFactory(curItem, curKey, binding, repeatArray,
                        component)

                createTime += (new Date - atime)

                if (component.vmodel) {
                    component.oldIndex = component.vmodel.$index//获取其现在的位置
                }

            }

            var btime = new Date - 0

            if (binding.keyName !== "$index") {
                proxy[binding.keyName] = curKey
            }

            proxy[binding.itemName] = curItem
            proxy.$index = i
            proxy.$first = i === 0
            proxy.$last = i === last
            asignTime += (new Date - btime)
            proxy.$id = value.$id + (repeatArray ? "" : "." + curKey)
            /*兼容1.4与1.5, 1.6去掉*/
            proxy.$outer = binding.$outer
            components[i] = component

            if (component.vmodel && component.vmodel !== proxy) {
                component.vmodel.$hashcode = false
            }
           
            component.index = i
            component.vmodel = proxy
            component.item = curItem
            component.itemName = binding.itemName
            if (repeatArray) {
                /*兼容1.4与1.5, 1.6去掉*/
                /* jshint ignore:start */
                (function (array, el) {
                    proxy.$remove = function () {
                        avalon.Array.remove(array, el)
                    }
                })(value, curItem)

                saveInCache(newCache, curItem, component)
                component.vmodel.$hashcode = "a:" + binding.itemName + ":a:" + (new Date - 0)
                /* jshint ignore:end */
            } else {
                value[curKey] = "$$getpath$$"

                component.vmodel.$hashcode = "o:" + binding.itemName + ":" + avalon.withPath + ":" + (new Date - 0)
                newCache[curKey] = component
            }

            if (newCom) {
                //对全新的虚拟节点进行绑定
                scanNodes(component.children, proxy)
                newCom = false
            }

        }
        console.log("第二次循环", new Date - now, last)
        console.log("创建", createTime, last)
        console.log("赋值", asignTime, last)
        while (component = reuse.shift()) {
            disposeVirtual([component])
            if (component.item) {
                component.item.$hashcode = false
            }
        }

        vnode.components = components

        var nodes = vnode.children
        nodes.length = 0

        for (var i in components) {
            pushArray(nodes, components[i].children)
        }

        nodes.unshift(new VComment(vnode.signature + ":start"))
        nodes.push(new VComment(vnode.signature + ":end"))

        binding.cache = newCache
        if (repeatArray) {
            binding.oldValue = value.concat()
        } else {
            binding.oldValue = newCache
        }
        addHook(vnode, binding.rendered, "afterChange", 95)
        addHooks(this, binding)
        if (--avalon.repeatCount === 0) {
            batchUpdateEntity(binding.vmodel.$id.split(".")[0])
        }

    },
    update: function (node, vnode, parent) {
        if (vnode.disposed) {
            return false
        }
        var groupText = vnode.signature
        var nodeValue = node.nodeValue
        if (node.nodeType === 8 && /\w+\d+\:start/.test(nodeValue) &&
                nodeValue !== groupText + ":start"
                ) {
            //更新注释节点的nodeValue
            updateSignature(node, nodeValue, groupText)
        }
        if (node.nodeType !== 8 || node.nodeValue !== groupText + ":start") {
            //如果是第一次
            var dom = vnode.toDOM()
            var keepChild = avalon.slice(dom.childNodes)
            if (groupText.indexOf("each") === 0) {
                avalon.clearHTML(parent)
                parent.appendChild(dom)
            } else {
                parent.replaceChild(dom, node)
            }
            updateEntity(keepChild, vnode.children, parent)
        } else {
            var breakText = groupText + ":end"
            var emptyFragment = document.createDocumentFragment()

            //将原有节点移出DOM, 试根据groupText分组
            var toClone = avalon.parseHTML(vnode.template)
            var fragments = [], i, el, next
            var sortedFragments = []
            var c = vnode.components
            var indexes = {}
            //尝试使用更高效的,不挪动元素的方式更新
            var inplaceIndex = 0
            var inplaceState = "maybe"
            for (i in c) {
                var ii = c[i].oldIndex
                if (ii !== void 0) {
                    indexes[ii] = ~~i
                    if (inplaceState) {
                        if (inplaceState === "maybenot") {
                            inplaceState = false
                            inplaceIndex = 0
                            continue
                        }
                        if (ii === indexes[ii]) {
                            inplaceIndex++
                        } else {
                            inplaceState = false
                        }
                    }
                } else {
                    indexes[i + "_"] = c[i]
                    if (inplaceState === "maybe") {
                        inplaceState = "maybenot"
                    }

                }
            }
            i = 0
            
            if (inplaceState && inplaceIndex && NaN) {
//                next = node
//                var entity = []
//                var continueRemove = false
//                var lastAnchor
//                while (next = next.nextSibling) {
//                    if (next.nodeValue === breakText) {
//                        lastAnchor = next
//                        break
//                    } else if (next.nodeValue === groupText) {
//                        entity.push(next)
//                        delete indexes[i]
//                        i++
//                    } else {
//                        if (inplaceIndex === i) {
//                            delete indexes[i]
//                            continueRemove = true
//                            break
//                        }
//                        entity.push(next)
//                    }
//                }
//
//                if (continueRemove) {
//                    while (next.nextSibling) {
//                        if (next.nodeValue !== breakText) {
//                            parent.removeChild(next.nextSibling)
//                        } else {
//                            lastAnchor = next.nextSibling
//                        }
//                    }
//                }
//                for (i in indexes) {
//                    var vdom = indexes[i]
//                    if (typeof vdom === "object") {
//                        emptyFragment.appendChild(toClone.cloneNode(true))
//                    }
//                }
//                if (vdom) {
//                    pushArray(entity, avalon.slice(emptyFragment.childNodes))
//                }
//                parent.insertBefore(emptyFragment, lastAnchor)
//                updateEntity(entity, vnode.children.slice(1, -1), parent)
            } else {
                var fragment = emptyFragment.cloneNode(false)
                while (next = node.nextSibling) {
                    if (next.nodeValue === breakText) {
                        break
                    } else if (next.nodeValue === groupText) {
                        fragment.appendChild(next)
                        if (indexes[i] !== void 0) {
                            sortedFragments[indexes[i]] = fragment
                            delete indexes[i]
                        } else {
                            fragments.push(fragment)
                        }
                        i++
                        fragment = emptyFragment.cloneNode(false)
                    } else {
                        fragment.appendChild(next)
                    }
                }
                for (i in indexes) {
                    i = parseFloat(i)
                    fragment = fragments.shift()
                    if (fragment) {
                        sortedFragments[ i ] = fragment
                    } else {
                        sortedFragments[ i ] = toClone.cloneNode(true)
                    }
                }

                for (i = 0, el; el = sortedFragments[i++]; ) {
                    emptyFragment.appendChild(el)
                }

                var entity = avalon.slice(emptyFragment.childNodes)
                parent.insertBefore(emptyFragment, node.nextSibling)
            }
            if (vnode.updateChildren) {
                updateEntity(entity, vnode.children.slice(1, -1), parent)
                delete vnode.updateChildren
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



avalon.directives.each = avalon.directives.repeat

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
// 新 位置: 旧位置
function isInCache(cache, vm) {
    var c
    if (Object(vm) === vm) {
        c = cache[vm.$hashcode]
        if (c) {
            delete cache[vm.$hashcode]
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
        cache[vm.$hashcode] = component
    } else {
        var trackId = avalon.type(vm) + "_" + vm
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

function initNames(repeatArray) {
    var binding = this
    if (repeatArray) {
        if (!binding.itemName) {
            binding.itemName = binding.param || "el"
            delete binding.param
        }
        if (!binding.keyName) {
            binding.keyName = "$index"
        }
    } else {
        if (!binding.keyName) {
            binding.keyName = "$key"
        }
        if (!binding.itemName) {
            binding.itemName = "$val"
        }

    }
    //处理$outer.names
    if (!binding.$outer.names) {
        var names = ["$first", "$last", "$index", "$outer"]
        if (repeatArray) {
            names.push("$remove")
        }
        avalon.Array.ensure(names, binding.itemName)
        avalon.Array.ensure(names, binding.keyName)

        binding.$outer.names = names.join(",")
    }
    this.initNames = noop
}


function repeatItemFactory(item, name, binding, repeatArray, c) {
    var oldItem = c.item, oldProxy = c.vmodel
    var before = binding.vmodel//上一级的VM
    var heirloom = {}
    var isObject = item && typeof item === "object"

    if (isObject && oldItem) {
        item.$events = oldItem.$events
        item.$events.__vmodel__ = item
    }
    if (!isObject && oldProxy) {
        return oldProxy
    }
    var useItem = item && item.$id
    var vm = mediatorFactory(before,
            useItem ? item : {},
            heirloom,
            function (obj, $accessors) {
                obj.$outer = obj.$outer || 1
                if (repeatArray) {
                    obj.$remove = noop
                }
                var keys = [binding.keyName, binding.itemName, "$index", "$first", "$last"]
                for (var i = 0, key; key = keys[i++]; ) {
                    if (key === binding.itemName) {
                        $accessors[key] = makeComputed("", key, heirloom, key, {
                            set: function (a) {
                                c.value[c.key] = a
                            },
                            get: function () {
                                return c.value[c.key]
                            }
                        })
                    } else if (oldProxy) {
                        $accessors[key] = oldProxy.$accessors[key]
                    } else {
                        $accessors[key] = makeObservable("", key, heirloom)
                    }
                }

            })
    if (oldProxy) {
        vm.$events = oldProxy.$events
        vm.$events.__vmodel__ = vm
    }
    return  vm
}


var repeatCom = avalon.components["ms-repeat"] =
        avalon.components["ms-each"] = {
    init: function () {

        var signature = makeHashCode(this.props.spec)
        this.signature = signature

        this.template = this.template + "<!--" + signature + "-->"

        this.copy = createVirtual(this.template)
    },
    clone: function () {
        var type = this.__type__
        this.__type__ = 1
        var clone = this.clone()
        clone.__type__ = type
        clone.signature = this.signature
        clone.copy = this.copy
        return clone
    }
}

function RepeatItem(array) {
    this.children = array.map(function (el) {
        return el.clone()
    })
}

avalon.repeatItemFactory = repeatItemFactory