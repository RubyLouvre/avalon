import {rcheckedType} from '../rcheckedType'

 /* istanbul ignore next */
function fixElement(dest, src) {
    if (dest.nodeType !== 1) {
        return
    }
    var nodeName = dest.nodeName.toLowerCase()

     if ( nodeName === "script" ) {
         if( dest.text !== src.text){
             dest.type = "noexec"
             dest.text = src.text;
             dest.type = src.type || ""
        }
     }else if (nodeName === 'object') {
        var params = src.childNodes
        if (dest.childNodes.length !== params.length) {
            avalon.clearHTML(dest)
            for(var i = 0, el ; el = params[i++]; ) {
                dest.appendChild(el.cloneNode(true))
            }
        }
    } else if (nodeName === 'input' && rcheckedType.test(src.nodeName)) {

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

 /* istanbul ignore next */
function getAll(context) {
    return typeof context.getElementsByTagName !== 'undefined' ?
            context.getElementsByTagName('*') :
            typeof context.querySelectorAll !== 'undefined' ?
            context.querySelectorAll('*') : []
}

 /* istanbul ignore next */
export function fixClone(src) {
    var target = src.cloneNode(true)
    //http://www.myexception.cn/web/665613.html
   // target.expando = null
    var t = getAll(target)
    var s = getAll(src)
    for(var i = 0; i < s.length; i++){
          fixElement(t[i], s[i])
    }
    return target
}

