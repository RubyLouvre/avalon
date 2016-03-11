var isVML = require('./isVML')
function fixTbody(wrapper, wrap, tag) {
    var target = wrap[1] === 'X<div>' ? wrapper.lastChild.firstChild : wrapper.lastChild
    if (target && target.tagName === 'TABLE' && tag !== 'tbody') {
        //IE6-7处理 <thead> --> <thead>,<tbody>
        //<tfoot> --> <tfoot>,<tbody>
        //<table> --> <table><tbody></table>
        for (var els = target.childNodes, i = 0, el; el = els[i++]; ) {
            if (el.tagName === 'TBODY' && !el.innerHTML) {
                target.removeChild(el)
                break
            }
        }
    }

    for (els = wrapper.all, i = 0; el = els[i++]; ) { //fix VML
        if (isVML(el)) {
            fixVML(el)
        }
    }
}

function fixVML(node) {
    if (node.currentStyle.behavior !== 'url(#default#VML)') {
        node.style.behavior = 'url(#default#VML)'
        node.style.display = 'inline-block'
        node.style.zoom = 1 //hasLayout
    }
}

module.exports = fixTbody
