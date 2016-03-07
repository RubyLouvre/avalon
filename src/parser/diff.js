var directives = avalon.directives
require("../directives/compact")
var empty = {
    children: [], props: {}
}
var emptyArr = []
function diff(current, previous) {
    for (var i = 0; i < current.length; i++) {
        var cur = current[i]
        var pre = previous[i] || empty
        switch (cur.type) {
            case "#text":
                if (!cur.skipContent) {
                    directives.expr.diff(cur, pre)
                }
                break
            case "#comment":
                if (cur.directive === "for") {
                    i = directives["for"].diff(current, previous, i)
                } else if (cur.directive === "if") {
                    directives["if"].diff(cur, pre)
                }
                break
            default:
                if (!cur.skipAttrs) {
                    diffProps(cur, pre)
                }
                if (!cur.skipContent) {
                    diff(cur.children, pre.children || emptyArr)
                }
                break

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
                directives[type] && directives[type].diff(current, previous || empty, type, name)
            } catch (e) {
                avalon.log(current, previous, e, "diffProps error")
            }
        }
    }

}

module.exports = avalon.diff = diff