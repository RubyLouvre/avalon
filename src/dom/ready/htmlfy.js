var noChild = avalon.oneObject("area,base,basefont,br,col,command,embed,hr,img,input,link,meta,param,source,track,wbr")

function getHTML(el) {
    switch (el.nodeType) {
        case 1:
            var type = el.nodeName.toLowerCase()
            return '<' + type + getAttributes(el.attributes) +
                    (noChild[type] ? '/>' : ('>' + getChild(el) + '</' + type + '>'))
        case 3:
            return el.nodeValue
        case 8:
            return '<!--' + el.nodeValue + '-->'
    }
}


function getAttributes(array) {
    var ret = []
    for (var i = 0, attr; attr = array[i++]; ) {
        if (attr.specified) {
            ret.push(attr.name.toLowerCase()+'="' + avalon.escapeHtml(attr.value) + '"')
        }
    }
    var str = ret.join(' ')
    return str ? ' ' + str : ''
}

function getChild(el) {
    var ret = ''
    for (var i = 0, node; node = el.childNodes[i++]; ) {
        ret += getHTML(node)
    }
    return ret
}

module.exports = getHTML
