var rcheckedType = /radio|checkbox/

function fix(dest, src) {
    if (dest.nodeType !== 1) {
        return
    }
    var nodeName = dest.nodeName.toLowerCase()
    if (nodeName === 'object') {
        if (dest.parentNode) {
            dest.outerHTML = src.outerHTML
        }

    } else if (nodeName === 'input' && rcheckedType.test(src.type)) {

        dest.defaultChecked = dest.checked = src.checked

        if (dest.value !== src.value) {
            dest.value = src.value
        }

    } else if (nodeName === 'option') {
        dest.defaultSelected = dest.selected = src.defaultSelected
    } else if (nodeName === 'input' || nodeName === 'textarea') {
        dest.defaultValue = src.defaultValue
    }
}


function getAll(context) {
    return typeof context.getElementsByTagName !== "undefined" ?
            context.getElementsByTagName("*") :
            typeof context.querySelectorAll !== "undefined" ?
            context.querySelectorAll("*") : []
}

function fixCloneNode(src) {
    var target = src.cloneNode(true)
    if (avalon.modern)
        return target
    var t = getAll(target)
    var s = getAll(src)
    avalon.each(s, function (i) {
        fix(t[i], s[i])
    })
    return target
}

module.exports = fixCloneNode