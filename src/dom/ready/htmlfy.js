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
            ret.push(attr.name.toLowerCase()+'="' + escapeHtml(attr.value) + '"')
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
var matchHtmlRegExp = /["'&<>]/;

function escapeHtml(string) {
    var str = '' + string;
    var match = matchHtmlRegExp.exec(str);

    if (!match) {
        return str;
    }

    var escape;
    var html = '';
    var index = 0;
    var lastIndex = 0;

    for (index = match.index; index < str.length; index++) {
        switch (str.charCodeAt(index)) {
            case 34: // "
                escape = '&quot;';
                break;
            case 38: // &
                escape = '&amp;';
                break;
            case 39: // '
                escape = '&#39;';
                break;
            case 60: // <
                escape = '&lt;';
                break;
            case 62: // >
                escape = '&gt;';
                break;
            default:
                continue;
        }

        if (lastIndex !== index) {
            html += str.substring(lastIndex, index);
        }

        lastIndex = index + 1;
        html += escape;
    }

    return lastIndex !== index
            ? html + str.substring(lastIndex, index)
            : html;
}
//https://github.com/nthtran/vdom-to-html
module.exports = getHTML
