
var makeHashCode = avalon.makeHashCode



//插入点机制,组件的模板中有一些a-slot元素,用于等待被外面的元素替代
function wrap(str) {
    return str.replace("return __value__", function (a) {
        var prefix = "if(Array.isArray(__value__)){\n" +
                "    __value__ = avalon.mix.apply({},__value__)\n" +
                "}\n"
        return prefix + a
    })
}

avalon.directive("widget", {
    parse: function (binding, num, elem) {
        if (elem.skipContent || !elem.children.length) {
            elem.children = createVirtual(elem.template)
        }
        var uuid = makeHashCode("w")
        avalon.caches[uuid] = elem.children
        var component = "config" + num
        return  "vnode" + num + ".props.wid = '" + uuid + "'\n" +
                "vnode" + num + ".children = avalon.caches[vnode" + num + ".props.wid] \n" +
                "var " + component + " = vnode" + num + ".props['a-widget'] = " + wrap(avalon.parseExpr(binding), "widget") + ";\n" +
                "if(" + component + "){\n" +
                "\tvnode" + num + " = avalon.component(vnode" + num + ", __vmodel__)\n" +
                "}\n"

    },
    createVm: function (topVm, defaults, options) {
        var after = avalon.mix({}, defaults, options)
        var events = {}
        //绑定生命周期的回调
        "$init $ready $dispose".replace(/\S+/g, function (a) {
            if (typeof after[a] === "function")
                events[a] = after[a]
            delete after[a]
        })
        var vm = avalon.mediatorFactory(topVm, after)
        for (var i in events) {
            vm.$watch(i, events[i])
        }
        return vm
    },
    diff: function (cur, pre) {
        var a = cur.props.resolved
        var p = pre.props.resolved
        if (a && typeof a === "object") {

        } else {
            cur.props["a-widget"] = p
        }

    },
    update: function () {
    },
    replaceElement: function (dom, node, parent) {
        var el = avalon.vdomAdaptor(node).toDOM()
        if (dom) {
            parent.replaceChild(el, dom)
        } else {
            parent.appendChild(el)
        }
        avalon(el).addClass(node.props.wid)
        if (el.children.length) {
            updateEntity(el.childNodes, node.children, el)
        }

        return false
    },
    replaceContent: function () {
    },
    switchContent: function () {

    }
})



var componentQueue = []
var resolvedComponents = {}
/*
 * 组件的类型 wtype
 * 0 组件会替代原来的元素 (grid,accordion, carousel,button, flipswitch...)
 * 1 组件替代元素的内部并不保留原内部元素 html
 * 2 组件替代元素的内部并保留原内部元素 路由
 * 3 组件不进行代替操作，而是出现在body的下方，当条件满足才出现（at, dialog, datepicker, dropdown）
 * 4 组件本身不产生元素,只是为子元素绑定事件,添加某种功能(draggable)
 */
var updateTypes = {
    0: "replaceElement",
    1: "replaceContent",
    2: "switchContent",
    3: "update",
    4: "update"
}
avalon.component = function (node, vm) {
    var isDefine = typeof (node) === "string"
    if (isDefine) {//这里用在组件定义时
        var name = node, definition = vm
        avalon.components[name] = definition
        var vms = {}
        for (var i = 0, obj; obj = componentQueue[i]; i++) {
            if (name === obj.name) {
                componentQueue.splice(i, 1)
                i--
                var vid = obj.vm.$id.split(".")[0]
                vms[vid] = true
            }
        }
        for (var id in vms) {
            batchUpdateEntity(id, true)
        }

    } else {
        //这里是用在组件实例化时
        var options = node.props['a-widget']
        var wid = node.props.wid
        var name = options.$type
        if (/(\:|-)/.test(node.type)) {
            name = node.type
        }
        name = name.replace(":", "-")
        //如果组件模板已经定
        if (resolvedComponents[id]) {
            return resolvedComponents[id].$render()//让widget虚拟DOM重新渲染自己并进行diff, patch
        }
        var widget = avalon.components[name]
        if (!widget) {//目标组件的文件还没有加载回来,放进列队中等待
            componentQueue.push({
                name: name,
                vm: vm
            })
            return node //返回普通的patch
        } else {

            delete options.$type

            var strTemplate = String(widget.template).trim()
            var virTemplate = createVirtual(strTemplate)

            insertSlots(virTemplate, node)
            var renderFn = avalon.createRender(virTemplate)
            var createVm = widget.createVm || avalon.directives.widget.createVm
            var vmodel = createVm(vm, widget.defaults, options)
            vmodel.$id = options.$id = makeHashCode(name)
            avalon.vmodels[vmodel.$id] = vmodel

            var widgetNode = renderFn(vmodel)
            if (widgetNode.length === 1) {
                widgetNode = widgetNode[0]
            } else {
                throw "组件要用一个元素包起来"
            }

            resolvedComponents[wid] = widgetNode

            widgetNode.$render = renderFn

            widgetNode.props.wid = node.props.wid
            if (!widget.update) {
                var wtype = node.props.wtype || 0
                widget.update = avalon.directives.widget[updateTypes[wtype]]
            }
            widgetNode.vmodel = vmodel
            widgetNode.change = widgetNode.change || []
            widgetNode.change.push(widget.update)

            widgetNode.afterChange = widgetNode.afterChange || []
            widgetNode.afterChange.push(afterChange)
            return widgetNode
        }
    }
}

function afterChange(dom, vnode, parent) {
    var isReady = true
    if (componentQueue.length !== 0) {
      //  vnode.vmodel.$fire("$ready", vnode.type)
        try {
            hasUnresolvedComponent(vnode)
        } catch (e) {
            isReady = false
        }
    }
    if (isReady) {
        vnode.vmodel.$fire("$ready", vnode.type)
    }
}
//如果组件没有resolved,元素会是这样子:
//<a-button wid="w453156877309" a-widget="undefined">xxx</a-button>
function hasUnresolvedComponent(vnode) {
    vnode.children.forEach(function (el) {
        if (el.type.charAt(0) !== '#') {
            if ("a-widget" in el.props) {
                throw "unresolved"
            }
            hasUnresolvedComponent(el)
        }
    })
}

function mergeTempale(main, slots) {
    for (var i = 0, el; el = main[i++]; ) {
        if (el.type.charAt(0) !== "#") {
            if (el.type === "a-slot") {
                var name = el.props.name || ""
                if (slots[name]) {
                    main.splice.apply(main, [i - 1, 1].concat(slots[name]))
                }
            } else {
                mergeTempale(el.children, slots)
            }
        }
    }
    return main
}

function insertSlots(main, node) {
    var slots = {}
    node.children.forEach(function (el) {
        if (el.type.charAt(0) !== "#") {
            var name = el.props.slot || ""
            if (slots[name]) {
                slots[name].push(el)
            } else {
                slots[name] = [el]
            }
        }
    })
    mergeTempale(main, slots)
}
