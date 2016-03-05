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
        var node2 = $render({})[0]
        node2.props.wid = node.props.wid
        node2.change = []
        node2.change.push(function (dom, node, parent) {
            var el = avalon.vdomAdaptor(node).toDOM()
            avalon(el).addClass(el.getAttribute("wid"))
            parent.replaceChild(el, dom)
        })
        return node2
    } else {
        return node
    }
}
//插入点机制,组件的模板中有一些av-slot元素,用于等待被外面的元素替代
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
                "var " + component + " = vnode" + num + ".props['av-widget'] = " + parse(binding) + ";\n" +
                "if(" + component + " && " + component +
                ".type && avalon.components[ " + component + ".type ]){\n" +
                "\tvnode" + num + " = avalon.component(vnode" + num + ", __vmodel__)\n" +
                "}\n"

    },
    diff: function (cur, pre) {
        var a = cur.props["av-widget"]
        var p = pre.props["av-widget"]
        if (a && typeof a === "object") {
            if (Array.isArray(a)) {
                a = cur.props["av-widget"] = avalon.mix.apply({}, a)
            }
            if (typeof p !== "object") {
                cur.changeStyle = a
            } else {
                var patch = {}
                var hasChange = false
                for (var i in a) {
                    if (a[i] !== p[i]) {
                        hasChange = true
                        patch = a[i]
                    }
                }
                if (hasChange) {
                    cur.changeStyle = patch
                }
            }
            if (cur.changeStyle) {

                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }
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