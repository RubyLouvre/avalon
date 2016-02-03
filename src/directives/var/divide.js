require("../../core/config")
var quote = require("../../base/builtin").quote
var quoteExpr = require('../../parser/parser').quoteExpr
var rexpr = avalon.config.rexpr
var rexprg = avalon.config.rexprg

function divide(binding) {
    var text = binding.expr,
            className,
            rightExpr
    var colonIndex = text.replace(rexprg, function (a) {
        return a.replace(/./g, "0")
    }).indexOf(":") //取得第一个冒号的位置
    if (colonIndex === -1) { // 比如 ms-class/effect="aaa bbb ccc" 的情况
        className = text
        rightExpr = true
    } else { // 比如 ms-class/effect-1="ui-state-active:checked" 的情况
        className = text.slice(0, colonIndex)
        rightExpr = text.slice(colonIndex + 1)
    }
    if (!rexpr.test(text)) {
        className = quote(className)
    } else {
        className = quoteExpr(className)
    }
    binding.expr = "[" + className + "," + rightExpr + "]"
}

module.exports = divide