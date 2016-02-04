var quote = require("../base/builtin").quote
function shimTemplate(element, skip) {
    var p = []
    for (var i in element.props) {
        if (skip && skip.test(i))
            continue
        p.push(i + "=" + quote(String(element.props[i])))
    }
    p = p.length ? " " + p.join(" ") : ""

    var str = "<" + element.type + p
    if (element.isVoidTag) {
        return str + "/>"
    }
    str += ">"

    str += element.template

    return str + "</" + element.type + ">"
}

module.exports = shimTemplate