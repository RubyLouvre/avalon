
avalon.directive("controller", {
    priority: 1,
    parse: function (binding, num) {
        var vm = "vm" + num
        var isObject = /\{.+\}/.test(binding.expr)
        var a = "\n\n\nvar " + vm + " =  avalon.vmodels[" + avalon.quote(binding.expr) + "]\n"
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
    diff: avalon.noop,
    update:avalon.noop
})

