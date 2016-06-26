var template = require('text!./template.html')
require('./style.scss')
require('./btn.scss')

avalon.component('ms-modal', {
    template: template,
    defaults: {
        title:'',
        content: ''
    },
    soleSlot: 'content'
})