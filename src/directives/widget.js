var createVirtual = require("../strategy/createVirtual")
var makeHashCode = require("../base/builtin").makeHashCode

var parse = require("../parser/parse")
avalon.components = {
    panel: {
        template: "<div>" +
                "<h1>This is my component!</h1>" +
                "<av-slot>" +
                "This will only be displayed if there is no content" +
                "to be distributed." +
                "</av-slot>" +
                "<h1>This is my component!</h1>" +
                "</div>"
    }
}
/*
 * 
 <div>
 <h1>This is my component!</h1>
 <slot>
 This will only be displayed if there is no content
 to be distributed.
 </slot>
 </div>
 */
avalon.component = function (node, vm) {
    // /(?:ms|av)(?:-|\:)(\w+)/node.type
    var option = node.props['av-widget']
    var widget = avalon.components[option.type]

    if (widget) {
        var id = node.props.cacheID
        delete avalon.caches[id]
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
        var mainTemplate = createVirtual(widget.template)

        var compileElement = mergeTempale(mainTemplate, slots)
        var $render = avalon.createRender(compileElement)
        var vnode = $render({})[0]
        vnode.props.wid = node.props.wid
        vnode.change = []
        vnode.change.push(function (dom, node, parent) {
            var el = avalon.vdomAdaptor(node).toDOM()
            avalon(el).addClass(el.getAttribute("wid"))
            parent.replaceChild(el, dom)
        })
        return vnode
    } else {
        return node
    }
}
//插入点机制,组件的模板中有一些av-slot元素,用于等待被外面的元素替代
function wrap(str) {
    return str.replace("return __value__", function (a) {
        return  "if(Array.isArray(__value__)){\n" +
                "    __value__ = avalon.mix.apply({},__value__)\n" +
                "}\n" + a
    })
}

avalon.directive("widget", {
    parse: function (binding, num, elem) {
        if (elem.skipContent || !elem.children.length) {
            elem.children = createVirtual(elem.template)
        }
        var uuid = makeHashCode("w")
        avalon.caches[uuid] = elem.children
        //console.log(avalon.caches[uuid])
        var component = "config" + num
        return  "vnode" + num + ".props.wid = '" + uuid + "'\n" +
                "vnode" + num + ".children = avalon.caches[vnode" + num + ".props.wid] \n" +
                "var " + component + " = vnode" + num + ".props['av-widget'] = " + wrap(parse(binding), "widget") + ";\n" +
                "if(" + component + " && " + component +
                ".type && avalon.components[ " + component + ".type ]){\n" +
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
    update: function (node, vnode) {

        // console.log(vnode.props["av-widget"])
    }
})

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
/*
 * 组件的类型 wtype
 * 1 组件会替代原来的元素 (grid,accordion, carousel,button, flipswitch...)
 * 2 组件替代元素的内部并不保留原内部元素 html
 * 3 组件替代元素的内部并保留原内部元素 路由
 * 4 组件不进行代替操作，而是出现在body的下方，当条件满足才出现（at, dialog, datepicker, dropdown）
 * 5 组件本身不产生元素,只是为子元素绑定事件,添加某种功能(draggable)
 */
