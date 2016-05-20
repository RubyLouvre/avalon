//var avalon = require('avalon')

avalon.component('ms-button', {
    template: '<button type="button"><span><slot name="buttonText"></slot></span></button>',
    defaults: {
        buttonText: "button",
        onDispose: function(){
          avalon.log('button被销毁')   
        }
    },
    soleSlot: 'buttonText'
})