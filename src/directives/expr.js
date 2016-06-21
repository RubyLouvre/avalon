var update = require('./_update')

avalon.directive('expr', {
    parse: avalon.noop,
    diff: function (cur, pre) {
        var curValue = cur.nodeValue+''
        if (curValue !== pre.nodeValue) {
            pre.nodeValue = curValue
            update(pre, this.update)
        }
    },
    update: function(dom, vdom){
        dom.nodeValue = vdom.nodeValue
    }
})