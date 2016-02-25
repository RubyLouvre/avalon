var directives = avalon.directives
require("../directives/compact")
var empty = {
    children:[], props: {}
}
function diff(current, previous) {
    for (var i = 0; i < current.length; i++) {
        var cur = current[i]
        var pre = previous[i] || empty
        if (cur.type === "#text") {
            if (!cur.skipContent) {
                directives.expr.diff(cur, pre )
            }
        } else {
            if (!cur.skipAttrs)
                diffProps(cur, pre)
            if (!cur.skipContent) {
                diff(cur.children, pre.children)
            }
        }
    }
}
var rmsAttr = /^(?:ms|av)-(\w+)-?(.*)/
function diffProps(current, previous) {
    current.change = current.change || []
    for (var name in current.props) {
        var match = name.match(rmsAttr)
        if (match) {
            name = match[1]
            directives[name] && directives[name].diff(current, previous, name)
        }
    }

}

module.exports = avalon.diff = diff