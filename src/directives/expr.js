var update = require('./_update')

avalon.directive('expr', {
    parse: avalon.noop,
    diff: function (cur, pre, steps) {
        if (cur.nodeValue !== pre.nodeValue) {
            cur.changeText = true
            update(cur, this.update, steps, 'expr')
        }
    },
    update: function(){}
})