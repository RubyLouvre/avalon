
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
                "\t\t__vmodel__ = " + vm + "\n" +
                "}\n\n\n"
        return str
    },
    diff: function () {
    },
    update: function(){}
})