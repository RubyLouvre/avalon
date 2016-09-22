var avalon = require('avalon2')
require('mmRouter')
var a = require('../perf/component/router/tab1.html')
var b = require('../perf/component/router/tab2.html')
var c = require('../perf/component/router/tab3.html')
require('../perf/component/router/tab1.js')
var vm = avalon.define({
    $id: 'main',
    main: '',
    aaa: "第一页的内容",
    bbb: "第二页的内容",
    ccc: "第三页的内容"
})
var map = {
    'aaa': a,
    'bbb': b,
    'ccc': c
}
avalon.router.add("/page-{count:\\d+}", function (param) {

    return '/aaa?'+ this.path.slice(1)
})

avalon.router.add("/:tab", function (param) {
    console.log(param,'!!')
    vm.main = map[param]
})





avalon.history.start({
    root: "/mmRouter"
})


var hash = location.hash.replace(/#!?/, '')
avalon.router.navigate(hash || '/aaa', 1)//默认打开
avalon.ready(function(){
    avalon.scan(document.body)
})
