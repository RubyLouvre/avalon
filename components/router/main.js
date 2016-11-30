var avalon = require('../../dist/avalon')
var mmRouter = require('./mmRouter')
var html1 = require('./first.html')
var html2 = require('./second.html')
var html3 = require('./third.html')
var vm1 = require('./firstVm')
var vm2 = require('./secondVm')

var root = avalon.define({
    $id: 'main',
    currPath: 'aaa',//只是用于测试
    currPage: 'aaa' //这是有用的
})


var states = {}

function addState(path, vm, html) {
    states[path] = {
        vm: vm,
        html: html
    }
}

addState('aaa', vm1, html1)

addState('bbb', vm2, html2)

addState('ccc', avalon.define({
    $id: 'third',
    aaa: 333
}), html3)


avalon.component('ms-view', {
    template: '<div ms-html="@page" class="ms-view"></div>',
    defaults: {
        page: '&nbsp;',
        path: 'no',
       
        onReady: function(e) {
            var path = e.vmodel.path
            var state = states[path]
            avalon.vmodels[state.vm.$id] = state.vm
            setTimeout(function() {//必须等它扫描完这个template,才能替换
                e.vmodel.page = state.html
            },100)

        },
        onDispose: function(e) {
            var path = e.vmodel.path
            var state = states[path]
            var vm = state.vm
            var render = vm.render
            render && render.dispose()
            delete avalon.vmodels[vm.$id]
        }
    }
})

function getPage(path) {
    path = path.slice(1)
    var html = '<xmp is="ms-view" class="view-container" ms-widget="{path:\'' + path + '\',page: @page}"><xmp>'
    return html
}

avalon.router.add("/aaa", function(a) {
    root.currPath = this.path

    root.currPage = getPage(this.path)
})
avalon.router.add("/bbb", function(a) {
    root.currPath = this.path
    root.currPage = getPage(this.path)
})
avalon.router.add("/ccc", function(a) {
    root.currPath = this.path
    root.currPage = getPage(this.path)
})


avalon.history.start({
    root: "/mmRouter"
})
avalon.ready(function() {
    avalon.scan(document.body)
})