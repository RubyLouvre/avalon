var ravalon = /(\w+)\[(avalonctrl)="(\S+)"\]/
var findNodes = DOC.querySelectorAll ? function(str) {
    return DOC.querySelectorAll(str)
} : function(str) {
    var match = str.match(ravalon)
    var all = DOC.getElementsByTagName(match[1])
    var nodes = []
    for (var i = 0, el; el = all[i++]; ) {
        if (el.getAttribute(match[2]) === match[3]) {
            nodes.push(el)
        }
    }
    return nodes
}