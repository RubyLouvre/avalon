/**
 * 虚拟DOM的4大构造器
 */
var VText = require('./VText')
var VComment = require('./VComment')
var VElement = require('./VElement')

avalon.vdomAdaptor = function (obj, method) {
    switch (obj.nodeType) {
        case 3:
            return VText.prototype[method].call(obj) 
        case 8:
            return VComment.prototype[method].call(obj)
        default:
            return VElement.prototype[method].call(obj)
    }
}

module.exports = {
    VText: VText,
    VComment: VComment,
    VElement: VElement
}
