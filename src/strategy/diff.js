/**
 * ------------------------------------------------------------
 * diff 对比新旧两个虚拟DOM树,根据directive中的diff方法为新虚拟DOM树
 * 添加change, afterChange更新钩子
 * ------------------------------------------------------------
 */

var rbinding = /^(?:ms|a)-(\w+)-?(.*)/
var directives = avalon.directives

var emptyArr = []
var emptyObj = {
    children: [], props: {}
}

function diff(current, previous) {
    for (var i = 0; i < current.length; i++) {
        var cur = current[i]
        var pre = previous[i] || emptyObj
        switch (cur.type) {
            case '#text':
                if (!cur.skipContent) {
                    directives.expr.diff(cur, pre)
                }
                break
            case '#comment':
                if (cur.directive === 'for') {
                    i = directives['for'].diff(current, previous, i)
                } else if (cur.directive === 'if') {
                    directives['if'].diff(cur, pre)
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

function diffProps(current, previous) {
    current.change = current.change || []
    for (var name in current.props) {
        var match = name.match(rbinding)
        if (match) {
            var type = match[1]
            try {
                if (directives[type]) {
                    directives[type].diff(current, previous || emptyObj, type, name)
                }
            } catch (e) {
                avalon.log(current, previous, e, 'diffProps error')
            }
        }
    }

}

module.exports = diff