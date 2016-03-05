var createVirtual = require("../strategy/createVirtual")

var parse = require("../parser/parse")
avalon.components = {
    panel: {}
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
avalon.component = function (option, vm, node) {

    return node
}
//插入点机制,组件的模板中有一些av-slot元素,用于等待被外面的元素替代
avalon.directive("widget", {
    parse: function (binding, num, elem) {
        if (elem.skipContent || !elem.children.length) {
            elem.children = createVirtual(elem.template)
        }
        var slots = {}

        elem.children.forEach(function (el) {
            if (el.type.charAt(0) !== "#") {
                var name = el.props.slot || ""
                if (slots[name]) {
                    slots[name].push(el)
                } else {
                    slots[name] = [el]
                }
            }
        })
        var template = "<div>" +
               
                "<av-slot>" +
                "This will only be displayed if there is no content" +
                "to be distributed." +
                "</av-slot>" +
                "<h1>This is my component!</h1>" +
                "</div>"
        var mainTemplate = createVirtual(template)
        var compileElement = mergeTempale(mainTemplate, slots)
        var $render = avalon.createRender(compileElement)
      //  console.log(mainTemplate)
      //  console.log(mergeTempale(mainTemplate, slots))
        var component = "config" + num
        return  "vnode" + num + ".children = " + JSON.stringify(elem.children) + "\n" +
                "var " + component + " = vnode" + num +
                ".props['av-widget'] = " + parse(binding) + ";\n" +
                "if(" + component + " && " + component +
                ".type && avalon.components[ " + component + ".type ]){\n" +
                "\tvnode" + num + " = avalon.component(" + component + ",__vmodel__, vnode" + num + ")\n" +
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
        console.log(vnode.props["av-widget"])
    }
})

function mergeTempale(main, slots) {
    for (var i = 0, el; el = main[i++]; ) {
        if (el.type.charAt(0) !== "#") {
            if (el.type === "av-slot") {
                var name = el.props.name || ""
                if (slots[name]) {
                    console.log("=========")
                    main.splice.apply(main, [i - 1, 1].concat(slots[name]))
                }
            } else {
                mergeTempale(el.children, slots)
            }
        }
    }
    return main
}