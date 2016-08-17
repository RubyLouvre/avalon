/**
 * 虚拟DOM的3大构造器
 */
var VText = require('./VText')
var VComment = require('./VComment')
var VElement = require('./VElement')
var VFragment = require('./VFragment')

avalon.vdomAdaptor = function (obj, method) {
    if (!obj) {//obj在ms-for循环里面可能是null
        return method === "toHTML" ? '' : document.createDocumentFragment()
    }
    switch (obj.nodeName) {
        case '#text':
            return VText.prototype[method].call(obj)
        case '#comment':
            return VComment.prototype[method].call(obj)
        case '#document-fragment':
            return VFragment.prototype[method].call(obj)
        case void(0):
            return (new VFragment(obj))[method]()
        default:
            return VElement.prototype[method].call(obj)
    }
}

module.exports = {
    VText: VText,
    VComment: VComment,
    VElement: VElement,
    VFragment: VFragment
}
