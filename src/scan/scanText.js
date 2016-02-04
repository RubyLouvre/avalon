var scanExpr = require("./scanExpr")
var addHooks = require("../vdom/hooks").addHooks

function scanText(node, vmodel) {
    var tokens = scanExpr(String(node.nodeValue), true)
    node.tokens = tokens
    var texts = []
    for (var i = 0, token; token = tokens[i]; i++) {
        if (token.type) {
            /* jshint ignore:start */
            token.expr = token.expr.replace(/^\s*::/, function () {
                token.oneTime = true
                return ""
            })
            /* jshint ignore:end */
            token.element = node
            token.vmodel = vmodel
            token.index = i
            token.array = texts
            avalon.injectBinding(token)
        } else {
            texts[i] = token.expr
            var nodeValue = texts.join("")
            if (nodeValue !== node.nodeValue) {
                node.nodeValue = nodeValue
                addHooks(avalon.directives["{{}}"], {
                   element: node,
                   priority:1160
                })
            }
        }
    }
    return [node]
}

module.exports = scanText