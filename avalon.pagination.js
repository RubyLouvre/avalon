define(["avalon", "text!avalon.pagination.html"], function(avalon, tmpl) {

    var styleEl = document.getElementById("avalonStyle")
    var cssText = ".ui-pagination{ padding:6px 4px; overflow:hidden;} " +
            ".ui-pagination a{  padding: 2px 8px;text-decoration: none;text-align:center; float:left;}" +
            ".ui-pagination a.ui-pagination-ellipsis{padding: 2px 0px;text-decoration: none;text-align:center;}"
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

    function getPages(vm) {
        var c = vm.currentPage, p = Math.ceil(vm.total / vm.perPages), pages = [], s = vm.showPages, max = p,
                left = c, right = c
        //一共有p页，要显示s个页面
        vm.maxPage = max
        if (p <= s) {
            for (var i = 1; i <= p; i++) {
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
        vm.firstPage = pages[0]
        vm.lastPage = pages[pages.length - 1]
        return  pages//[0,1,2,3,4,5,6]
    }
    var widget = avalon.ui.pagination = function(element, data, vmodels) {
        var $element = avalon(element)
        var options = data.paginationOptions
        $element.addClass("ui-pagination ui-widget-header ui-corner-all ui-buttonset ")
        var model = avalon.define(data.paginationId, function(vm) {
            avalon.$skipArray = ["perPages", "showPages", "currentIndex", "total", "ellipseText"]//这些属性不被监控
            avalon.mix(vm, options)
            vm.jumpPage = function(event, page) {
                event.preventDefault()
                if (page !== vm.currentPage) {
                    switch (page) {
                        case "first":
                            vm.currentPage = 1
                            break
                        case "last":
                            vm.currentPage = vm.maxPage
                            break
                        case "next":
                            vm.currentPage++
                            if (vm.currentPage > vm.maxPage) {
                                vm.currentPage = vm.maxPage
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
                    vm.pages = getPages(vm)
                }
            }
            vm.pages = getPages(vm)
        })
        avalon.nextTick(function() {
            element.innerHTML = tmpl
            avalon.scan(element, [model].concat(vmodels))
        })
        return model
    }
    widget.defaults = {
        perPages: 10, //每页显示多少条目
        showPages: 10, //一共显示多页，从1开始
        currentPage: 17, //当前被高亮的页面，从1开始
        total: 200,
        pages: [], //装载所有要显示的页面，从1开始
        nextText: ">",
        prevText: "<",
        ellipseText:"…",
        firstPage: 0, //当前可显示的最小页码，不能小于1
        lastPage: 0, //当前可显示的最大页码，不能大于maxPage
        maxPage: 0, //通过Math.ceil(vm.total / vm.perPages)求得
        getHref: function(page) {
            return "?page=" + page
        },
        getTitle: function(a) {
            switch (a) {
                case "first":
                    return "Go To First Page"
                case "prev":
                    return "Go To Previous Page"
                case "next":
                    return "Go To Next Page"
                case "last":
                    return "Go To Last Page"
                default:
                    return "Go to page " + a + ""
            }
        }
    }
    return avalon
})