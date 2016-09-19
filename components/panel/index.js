var button = require('../button/index')
var tmpl = require('./template.html')
avalon.component('ms-panel', {
    template: tmpl,
    defaults: {
        body: "&nbsp;&nbsp;",
        button: {
            buttonText: 'click me!'
        }
    },
    soleSlot: 'body'
})