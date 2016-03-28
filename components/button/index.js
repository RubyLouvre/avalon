//var avalon = require('avalon')

avalon.component('ms-button', {
    template: '<button type="button"><span>{{@text}}</span></button>',
    defaults: {
        text: "buttonText"
    }
})