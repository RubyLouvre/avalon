/**
 * 虚拟DOM的4大构造器
 */
var VText = require('./VText')
var VComment = require('./VComment')
var VElement = require('./VElement')

avalon.vdomAdaptor = function (obj, method) {
    if (!obj) {//obj在ms-for循环里面可能是null
        return (method === "toHTML" ? '' :
            avalon.avalonFragment.cloneNode(false))
    }
    switch (obj.nodeType) {
        case 3:
            return VText.prototype[method].call(obj)
        case 8:
            return VComment.prototype[method].call(obj)
        case 1:
            return VElement.prototype[method].call(obj)
        default:
            if (Array.isArray(obj)) {
                if (method === "toHTML") {
                    return obj.map(function (a) {
                        return avalon.vdomAdaptor(a, 'toHTML')
                    }).join('')
                } else {
                    var f = avalon.avalonFragment.cloneNode(false)
                    obj.forEach(function (a) {
                        f.appendChild(avalon.vdomAdaptor(a, 'toDOM'))
                    })
                    return f
                }
            }
    }
}

module.exports = {
    VText: VText,
    VComment: VComment,
    VElement: VElement
}
