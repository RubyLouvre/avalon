

var attrDir = avalon.directive("attr", {
    init: function (binding) {
        //{{aaa}} --> aaa
        //{{aaa}}/bbb.html --> (aaa) + "/bbb.html"
        binding.expr = normalizeExpr(binding.expr.trim())
    },
    change: function (val, binding) {
        var elem = binding.element
        if (elem) {
            var change = addHooks(elem, "changeAttrs")
            var name = binding.param
            var toRemove = (val === false) || (val === null) || (val === void 0)
            change[name] = toRemove ? false : val
            change = addHooks(elem, "changeHooks")
            change.attr = directives.attr.update
        }
    },
    update: attrUpdate
})

//这几个指令都可以使用插值表达式，如ms-src="aaa/{{b}}/{{c}}.html"
"title,alt,src,value,css,include,href".replace(rword, function (name) {
    directives[name] = attrDir
})
