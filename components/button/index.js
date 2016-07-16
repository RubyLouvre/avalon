//var avalon = require('avalon')

avalon.component('ms-button', {
    template: '<button type="button"><span><slot /></span></button>',
    defaults: {
        buttonText: "button"
    },
    soleSlot: 'buttonText'
})