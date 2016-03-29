var button = require('../button/index')
var tmpl = require('text!./template.html')

avalon.component('ms-panel', {
    template: tmpl,
    defaults: {
        body: "&nbsp;&nbsp;"
    },
    contentSlot: 'body'
})