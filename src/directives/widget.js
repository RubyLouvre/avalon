
var parse = require("../parser/parse")
var makeHashCode = require("../base/builtin").makeHashCode
var createVirtual = require("../strategy/createVirtual")
var batchUpdateEntity = require("../strategy/batchUpdateEntity")


//插入点机制,组件的模板中有一些av-slot元素,用于等待被外面的元素替代
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
                "var " + component + " = vnode" + num + ".props['av-widget'] = " + wrap(parse(binding), "widget") + ";\n" +
                "if(" + component + "){\n" +
                "\tvnode" + num + " = avalon.component(vnode" + num + ", __vmodel__)\n" +
                "}\n"

    },
    diff: function (cur, pre) {
        var a = cur.props.resolved
        var p = pre.props.resolved
        if (a && typeof a === "object") {

        } else {
            cur.props["av-widget"] = p
        }

    },
    update: function () {
    },
    replaceElement: function (dom, node, parent) {
        var el = avalon.vdomAdaptor(node).toDOM()
        avalon(el).addClass(el.getAttribute("wid"))
        parent.replaceChild(el, dom)
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
    //console.log(isDefine)
    if (isDefine) {
        var name = node, definition = vm
        avalon.components[name] = definition
        var vms = {}
        for (var i = 0, obj; obj = componentQueue[i]; i++) {
            if (name === obj.name) {
                componentQueue.splice(i, 1)
                i--;
                var vid = obj.vm.$id.split(".")[0]
                vms[vid] = true
            }
        }
        for (var id in vms) {
            batchUpdateEntity(id, true)
        }

    } else {

        var options = node.props['av-widget']
        var id = node.props.wid
        var name = options.$type
        if (/(\:|-)/.test(node.type)) {
            name = node.type
        }
        //如果组件模板已经定
        if (resolvedComponents[id])
            return resolvedComponents[id].$render()//让widget虚拟DOM重新渲染自己并进行diff, patch

        var widget = avalon.components[name]
        if (!widget) {
            componentQueue.push({
                name: name,
                vm: vm
            })
            return node //返回普通的patch
        } else {
            if (!options.$id) {
                options.$id = makeHashCode(name)
            }
            delete options.$type
            
            var strTemplate = String(widget.template).trim()
            var virTemplate = createVirtual(strTemplate)

            insertSlots(virTemplate, node)
            var renderFn = avalon.createRender(virTemplate)
            var vmodel = widget.createVm(vm, widget.defaults, options)

            var widgetNode = renderFn(vmodel || {})
            if (widgetNode.length === 1) {
                widgetNode = widgetNode[0]
            } else {
                throw "widget error"
            }

            resolvedComponents[id] = widgetNode

            widgetNode.$render = renderFn

            widgetNode.props.wid = node.props.wid
            if (!widget.update) {
                var wtype = node.props.wtype || 0
                widget.update = avalon.directives.widget[updateTypes[wtype]]
            }

            widgetNode.change = widgetNode.change || []
            widgetNode.change.push(widget.update)
            return widgetNode
        }
    }
}



function mergeTempale(main, slots) {
    for (var i = 0, el; el = main[i++]; ) {
        if (el.type.charAt(0) !== "#") {
            if (el.type === "av-slot") {
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
