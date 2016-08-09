avalon.speedUp = function (arr) {
    for (var i = 0; i < arr.length; i++) {
        hasDirective(arr[i])
    }
    return arr
}

function hasDirective(a) {
    switch (a.nodeType) {
        case 3:
            if (avalon.config.rbind.test(a.nodeValue)) {
                a.dynamic = 'expr'
                return true
            } else {
                a.skipContent = true
                return false
            }
        case 8:
            if (a.dynamic) {
                return true
            } else {
                a.skipContent = true
                return false
            }
        case 1:
            if (a.props['ms-skip']) {
                a.skipAttrs = true
                a.skipContent = true
                return false
            }
            if (/^ms\-/.test(a.nodeName) || hasDirectiveAttrs(a.props)) {
                a.dynamic = true
            } else {
                a.skipAttrs = true
            }
            if (a.isVoidTag && !a.dynamic) {
                a.skipContent = true
                return false
            }
            var hasDirective = childrenHasDirective(a.children)
            if (!hasDirective && !a.dynamic) {
                a.skipContent = true
                return false
            }
            return true
        default:
            if (Array.isArray(a)) {
                return childrenHasDirective(a)
            }
    }
}

function childrenHasDirective(arr) {
    var ret = false
    for (var i = 0, el; el = arr[i++]; ) {
        if (hasDirective(el)) {
            ret = true
        }
    }
    return ret
}
var rdirAttr = /^(\:|ms\-)\w/
function hasDirectiveAttrs(props) {
    if ('ms-skip' in props)
        return false
    for (var i in props) {
        if (rdirAttr.test(i)) {
            return true
        }
    }
    return false
}
