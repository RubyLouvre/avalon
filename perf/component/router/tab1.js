require('ms-pager')//加载官方的ms-pager
require('./ms-grid')//加载自己的ms-grid
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