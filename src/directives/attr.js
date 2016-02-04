var quoteExpr = require("../parser/parser").quoteExpr
var hooks = require("../vdom/hooks")
var addData = hooks.addData
var addHooks = hooks.addHooks

var attrUpdate = require("../dom/attr")
var propMap = require("../dom/propMap")
var rword = require("../base/builtin").rword

var attrDir = avalon.directive("attr", {
    init: function (binding) {
        //{{aaa}} --> aaa
        //{{aaa}}/bbb.html --> (aaa) + "/bbb.html"
        binding.expr = quoteExpr(binding.expr.trim())
    },
    change: function (val, binding) {
        var vnode = binding.element
        if (vnode) {
            var data = addData(vnode, "changeAttr")
            var name = binding.param
            var toRemove = (val === false) || (val === null) || (val === void 0)
            if (toRemove) {
                delete vnode.props[name]
                data[name] = false
            } else {
                if (!propMap[name]) {
                    vnode.props[name] = val
                }
                data[name] = val
            }
        }
        addHooks(this, binding)
    },
    update: attrUpdate
})

//这几个指令都可以使用插值表达式，如ms-src="aaa/{{b}}/{{c}}.html"
"title,alt,src,value,css,href".replace(rword, function (name) {
    avalon.directives[name] = attrDir
})
