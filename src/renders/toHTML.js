export function toHTML(el) {
    if (el.nodeName === '#comment') {

        return '<!--' + el.nodeValue + '-->'
    } else if (el.nodeName === '#text') {
        return el.nodeValue
    } else if (el.props) {
        var arr = []
        var props = el.props || {}
        for (var i in props) {
            var val = props[i]
            if (val != null && val !== false) {
                arr.push(i + '=' + avalon.quote(props[i] + ''))
            }
        }
        arr = arr.length ? ' ' + arr.join(' ') : ''
        var str = '<' + el.nodeName + arr
        if (el.vtype === 1) {
            return str + '/>'
        }
        str += '>'

        str += toHTML(el.children)

        return str + '</' + el.nodeName + '>'
    } else if (el.nodeName === '#document-fragment') {
        return toHTML(el.children)
    } else if (Array.isArray(el)) {
        return el.map(
            elem => toHTML(elem)
        ).join('')
    } else {
        return ''
    }

}