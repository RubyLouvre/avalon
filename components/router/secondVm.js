var avalon = require('../../dist/avalon')
var heredoc = require('./heredoc')
require('./pagination')


function genData(n) {
    var list = []
    for (var i = 0; i < n; i++) {
        list.push({
            aaa: new Date - i,
            bbb: Math.random().toString(32).replace(/0\./, ""),
            ccc: (Math.random() + "").replace(/0\./, ""),
            ddd: i
        })
    }
    return list
}
 var vm = avalon.define({
    $id: 'widget1',
    header: ['aaa', 'bbb', 'ccc'],
    start: 0,
    count: 10,
    data: genData(300),
    ready: function (e) {
        e.vmodel.$watch('currentPage', function (a) {
            vm.start = a - 1
            avalon.log(vm.start)
        })
    },
    ddd: 'bbb'
})
 avalon.component('ms-grid', {
        template: heredoc(function () {
            /*
             <div class="grid">
             <div><slot name="header"/></div>
             <div><slot name="tbody"/></div>
             <div class="pager"><slot name="pager" /></div>
             </div>
             */
        }),
        defaults: {}
    })
    
module.exports = vm