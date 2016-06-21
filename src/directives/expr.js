var update = require('./_update')

avalon.directive('expr', {
    parse: avalon.noop,
    diff: function (copy, src) {
        var copyValue = copy.nodeValue+''
        if (copyValue !== src.nodeValue) {
            src.nodeValue = copyValue
            console.log(src.dom, src.nodeValue)
            update(src, this.update)
        }
    },
    update: function(dom, vdom){
        dom.nodeValue = vdom.nodeValue
    }
})