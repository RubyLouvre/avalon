var avalon = require('avalon2')
require('ms-pager')

window.vm = avalon.define({
    $id: 'test',
    config: {
        totalPages: 0,
        showPages: 2,
        currentPage:1,
        nextText: '下一页',
        prevText: '上一页'
    }
})

setTimeout(function(){
    window.vm.config = {
        totalPages: 2,
        showPages: 2
    }
}, 3000)