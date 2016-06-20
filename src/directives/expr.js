var update = require('./_update')

avalon.directive('expr', {
    parse: avalon.noop,
    diff: function (cur, pre, steps) {
        if (cur.nodeValue !== pre.nodeValue) {
            pre.nodeValue = cur.nodeValue
            update(pre, this.update, steps, 'expr')
        }
    },
    update: function(dom, vdom){
        dom.nodeValue = vdom.nodeValue
    }
})