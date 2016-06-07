var avalon = require('../dist/avalon')
var template = require('text!./template.html')
require('style!css!./common.css')

require('style!css!./pager.css')

avalon.component('ms-pager', {
    template: template,
    defaults: {
        perPages: 10, //@config {Number} 每页包含多少条目
        showPages: 10, //@config {Number} 中间部分一共要显示多少页(如果两边出现省略号,即它们之间的页数) 
        currentPage: 1, //@config {Number} 当前选中的页面 (按照人们日常习惯,是从1开始)，它会被高亮 
        _currentPage: 1, //@config {Number}  跳转台中的输入框显示的数字，它默认与currentPage一致
        totalItems: 200, //@config {Number} 总条目数
        totalPages: 0, //@config {Number} 总页数,通过Math.ceil(vm.totalItems / vm.perPages)求得
        firstPage: 0, //@config {Number} 当前可显示的最小页码，不能小于1
        lastPage: 0, //@config {Number} 当前可显示的最大页码，不能大于totalPages
        alwaysShowNext: false, //@config {Boolean} 总是显示向后按钮
        alwaysShowPrev: false, //@config {Boolean} 总是显示向前按钮
        showFirstOmit: false,
        showLastOmit: false,
        showJumper: false, //是否显示输入跳转台
        onJump: function (e, vm) {
        },
        $i18n: {
            prevText: "上一页",
            nextText: "下一页",
            confirmText: "确定",
            totalText: "共",
            pagesText: "页",
            pageText: "页",
            toText: "到",
            jumpToText: "跳转到",
            currentText: "当前页",
            firstText: "第一页",
            lastText: "最后一页",
            numberText: "第"
        },
        $skipArray: ['firstPage', 'totalPages','lastPage', 'showFirstOmit', 'showLastOmit'],
        onInit: function (e) {
            var vm = e.vmodel
            console.log("onInit",'---')
            vm.pages = vm.getPages()
        },
        isShowPrev: function () {
            var vm = this
            var a = vm.alwaysShowPrev
            var b = vm.firstPage
            return a || b !== 1
        },
        isShowNext: function () {
            var vm = this
            var a = vm.alwaysShowNext
            var b = vm.lastPage
            var c = vm.totalPages
            return a || b !== c
        },
        getPages: function () {

            var vm = this
            var c = vm.currentPage
            var max = Math.ceil(vm.totalItems / vm.perPages), pages = [], s = vm.showPages,
                    left = c, right = c
            //一共有p页，要显示s个页面

            if (max <= s) {
                for (var i = 1; i <= max; i++) {
                    pages.push(i)
                }
            } else {
                pages.push(c)
                while (true) {
                    if (pages.length >= s) {
                        break
                    }
                    if (left > 1) {//在日常生活是以1开始的
                        pages.unshift(--left)
                    }
                    if (pages.length >= s) {
                        break
                    }
                    if (right < max) {
                        pages.push(++right)
                    }
                }
            }
            vm.totalPages = max
            vm.firstPage = pages[0] || 1
            vm.lastPage = pages[pages.length - 1] || 1
            vm.showFirstOmit = vm.firstPage > 2
            vm.showLastOmit = vm.lastPage < max - 1

            return  pages//[0,1,2,3,4,5,6]
        },
        jumpPage: function (event, page) {
           console.log(page,"----")
            event.preventDefault()
       
            
            var target = event.target
            var vm = this
            var enabled = target.className.indexOf("state-disabled") === -1
            if (enabled && page !== vm.currentPage) {
                avalon.suspendUpdate += 100
                switch (page) {
                    case "first":
                        vm.currentPage = 1
                        break
                    case "last":
                        vm.currentPage = vm.totalPages
                        break
                    case "next":
                        vm.currentPage++
                        if (vm.currentPage > vm.totalPages) {
                            vm.currentPage = vm.totalPages
                        }
                        break
                    case "prev":
                        vm.currentPage--
                        if (vm.currentPage < 1) {
                            vm.currentPage = 1
                        }
                        break
                    default:
                        vm.currentPage = page
                        break
                }
                avalon.suspendUpdate -= 100
                vm.onJump.call(vm, event)
                var old = vm.pages.concat()
                var p = vm.getPages()
                console.log(p)
                vm.pages = p
            }

        },
        pages: [],
        getTitle: function (a, currentPage, totalPages) {

            var regional = this.$i18n

            switch (a) {
                case "first":
                    if (currentPage == 1) {
                        return genTitle(regional.currentText)
                    }
                    return genTitle(regional.jumpToText + " " + regional.firstText)
                case "prev":
                    return genTitle(regional.jumpToText + " " + regional.prevText)
                case "next":
                    return genTitle(regional.jumpToText + " " + regional.nextText)
                case "last":
                    if (currentPage === totalPages) {
                        return genTitle(regional.currentText)
                    }
                    return genTitle(regional.jumpToText + " " + regional.lastText)
                default:
                    if (a === currentPage) {
                        return genTitle(regional.currentText)
                    }
                    return genTitle(regional.jumpToText + regional.numberText + " " + a + regional.pageText)
            }
        }

    }
})

function genTitle(str) {
    return {title: str}
}

module.exports = avalon
