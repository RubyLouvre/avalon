//如果select的option没有ms-*或{{}}
//那么它们是以template形式存在,需要转换成虚拟节点
function genVirtualSelectChildren(cur, curValue) {
    var options = []
    cur.children.forEach(function (a) {
        if (a.type === 'option') {
            options.push(a)
        } else if (a.type === 'optgroup') {
            a.children.forEach(function (c) {
                if (c.type === 'option') {
                    options.push(c)
                }
            })
        }
    })
    var multi = cur.props.multiple
    var map = {}
    var one = multi === null || multi === void 0 || multi === false
    if (Array.isArray(curValue)) {
        curValue.forEach(function (a) {
            map[a] = 1
        })
    } else {
        map[curValue] = 1
    }
    for (var i = 0, option; option = options[i++]; ) {
        var v = 'value' in option.props ? option.props.value :
                (option.children[0] || {nodeValue: ''}).nodeValue.trim()
        option.props.selected = !!map[v]
        if (map[v] && one) {
            break
        }
    }
}

module.exports = genVirtualSelectChildren