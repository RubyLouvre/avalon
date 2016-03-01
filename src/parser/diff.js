var directives = avalon.directives
require("../directives/compact")
var empty = {
    children: [], props: {}
}
function diff(current, previous) {
    for (var i = 0; i < current.length; i++) {
        var cur = current[i]
        var pre = previous[i] || empty
        if (cur.type === "#text") {
            if (!cur.skipContent) {
                directives.expr.diff(cur, pre)
            }
        } else if (cur.type === "#comment") {
            if (!cur.skipContent) {
                if (cur.signature + ":start" === cur.nodeValue) {
                    i = directives["for"].diff(current, previous, i)
                }
            }
        } else {
            if (!cur.skipAttrs) {
                diffProps(cur, pre)
            }
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
            var type = match[1]
            try {
                directives[type] && directives[type].diff(current, previous, type, name)
            } catch (e) {
                avalon.log(current, previous, e, "diffProps error")
            }
        }
    }

}

module.exports = avalon.diff = diff