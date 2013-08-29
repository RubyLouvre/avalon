define(["avalon"], function(avalon) {
    //判定是否触摸界面
    var defaults = {
        perPages: 10, //每页显示多少条目
        showPages: 10, //一共显示多页
        currentIndex: 8,
        total: 200,
        pages: [],
        nextText: "下一页&gt;",
        prevText: "&lt;上一页",
        firstPage: 0,
        lastPage: 0,
        maxPage: 0
    }

    var domParser = document.createElement("div")
    avalon.ui.pagination =  function(element, id, vmodels, opts) {
        var $element = avalon(element)
        var options = avalon.mix({}, defaults, opts, $element.data())

        $element.addClass("ui-widget-header ui-corner-all ui-buttonset ")
        element.style.cssText += "padding:6px 4px"
     var   model = avalon.define(id, function(vm) {
            avalon.mix(vm, options)

            function getShowPages() {

                var c = vm.currentIndex, p = vm.total / vm.perPages, pages = [c], s = vm.showPages, max = p,
                        left = c, right = c
                if (p <= s) {
                    for (var i = 0; i < p; i++) {
                        pages.push(i)
                    }
                } else {
                    while (true) {
                        if (pages.length >= s) {
                            break
                        }
                        if (left >= 1) {//在日常生活是以1开始的
                            pages.unshift(--left)
                        }
                        if (pages.length >= s) {
                            break
                        }
                        if (right + 1 < max) {
                            pages.push(++right)
                        }

                    }
                }
                vm.firstPage = pages[0]
                vm.maxPage = max - 1
                vm.lastPage = pages[pages.length - 1]
                return  pages//[0,1,2,3,4,5,6]
            }
            vm.jumpPage = function(event) {
                event.preventDefault()
                if (this.$vmodel.page !== vm.currentIndex) {
                    vm.currentIndex = this.$vmodel.page
                    vm.pages = getShowPages()
                }
            }
            vm.prevPage = function(event) {
                event.preventDefault()
                vm.currentIndex--
                vm.pages = getShowPages()
            }
            vm.jumpFirstPage = function(event) {
                event.preventDefault()
                vm.currentIndex = 0
                vm.pages = getShowPages()
            }
            vm.jumpLastPage = function(event) {
                event.preventDefault()
                vm.currentIndex = vm.maxPage
                vm.pages = getShowPages()
            }
            vm.nextPage = function(event) {
                event.preventDefault()
                vm.currentIndex++
                vm.pages = getShowPages()
            }
            vm.pages = getShowPages()
        })
        var cssText = "margin:4px 4px; padding: 2px 8px;text-decoration: none;text-align:center;";
        avalon.nextTick(function() {
            element.setAttribute("ms-each-page", "pages")
            element.innerHTML = '<a ms-href="?page={{page}}" ms-class-1="ui-corner-left：page == 0" ms-class-2="ui-corner-right：page == maxPage" ms-hover="ui-state-hover" ms-click="jumpPage" class="ui-state-default" style="' 
                    + cssText + '" ms-class-3="ui-state-activecurrentIndex == page"' +  ' >{{page+1}}</a>';
            avalon.scan(element, model)
            domParser.innerHTML = '<span ms-visible="firstPage" style="' + 'padding: 2px 4px;text-decoration: none;text-align:center;' + '" >…</span>' +
                    '<a href="" ms-visible="firstPage" ms-hover="ui-state-hover" class="ui-state-default" style="' + cssText + '" ms-click="jumpFirstPage" >1</a>' +
                    '<a href="" ms-visible="firstPage" ms-hover="ui-state-hover" class="ui-state-default ui-corner-left" style="' + cssText + '" ms-click="prevPage"  ms-html="prevText"></a>' +
                    '<a href="" ms-visible="lastPage != maxPage" ms-hover="ui-state-hover" class="ui-state-default ui-corner-right" style="' + cssText + '" ms-click="nextPage" ms-html="nextText"></a>' +
                    '<a href="" ms-visible="lastPage != maxPage" ms-hover="ui-state-hover" class="ui-state-default" style="' + cssText + '" ms-click="jumpLastPage" >{{maxPage+1}}</a>' +
                    '<span ms-visible="lastPage != maxPage"  style="' + 'padding: 2px 4px;text-decoration: none;text-align:center;' + '" >…</span>';
            var a = domParser.removeChild(domParser.firstChild)
            element.insertBefore(a, element.firstChild)
            a = domParser.removeChild(domParser.firstChild)
            element.insertBefore(a, element.firstChild)
            a = domParser.removeChild(domParser.firstChild)
            element.insertBefore(a, element.firstChild)

            a = domParser.removeChild(domParser.lastChild)
            element.appendChild(a)
            a = domParser.removeChild(domParser.lastChild)
            element.appendChild(a)
            a = domParser.removeChild(domParser.lastChild)
            element.appendChild(a)
            avalon.scan(element, [model].concat(vmodels))
        })
        return model
    }

    return avalon
})