var quote = require("../base/builtin").quote

avalon.directive("controller", {
    priority: 1,
    parse: function (binding, num) {
        var vm = "vm" + num
        var isObject = /\{.+\}/.test(binding.expr)
        var a = "\n\n\nvar " + vm + " =  avalon.vmodels[" + quote(binding.expr) + "]\n"
        var b = "\n\n\nvar " + vm + " = " + binding.expr + "\n"
        var str = (isObject ? b : a) +
                "if(" + vm + "){\n" +
                "\tif(__vmodel__){\n" +
                "\t\t__vmodel__ = avalon.mediatorFactory(__vmodel__, " + vm + ")\n" +
                "\t}else{\n" +
                "\t\t__vmodel__ = " + vm + "\n" +
                "\t}\n" +
                "}\n\n\n"
        return str
    },
    diff: function () {
    }
})

//avalon.scan = function (el) {
//    var v = el.getAttribute("ms-controller") || el.getAttribute("av-controller")
//    if (v) {
//        el.removeAttribute("ms-controller")
//        el.removeAttribute("av-controller")
//        el.setAttribute("data-controller", v)
//        avalon(el).removeClass("ms-controller av-controller")
//    }
//    if (!v) {
//        v = el.getAttribute("data-controller")
//    }
//    if (v) {
//        if (typeof el.getAttribute(":template") !== "string") {
//            el.setAttribute(":template", el.outerHTML)
//        } else {
//
//        }
//    }
//    for (var i = 0, child; child = el.childNodes[i++]; ) {
//        if (child.nodeType === 1) {
//            avalon.scan(child)
//        }
//    }
//}
