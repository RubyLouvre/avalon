/**
 * 虚拟DOM的4大构造器
 */
var VText = require('./VText')
var VElement = require('./VElement')
var VComment = require('./VComment')
avalon.vdomAdaptor = function (obj) {
    switch (obj.type) {
        case '#text':
            return new VText(obj)
        case '#comment':
            return new VComment(obj)
        default:
            return new VElement(obj)
    }
}

module.exports = {
    VText: VText,
    VComment: VComment,
    VElement: VElement
}
