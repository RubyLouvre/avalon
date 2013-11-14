define(["avalon"], function (avalon) {

    avalon.ui.tabs = function (element, data, vmodels) {
        var el, tabsParent, tabs = [], tabpanels = [], tabpanelIncludes = []
        var options = data.tabsOptions
        // 清空它内部所有节点，并收集其内容，构建成tabs与tabpanels两个数组
        while (el = element.firstChild) {
            if (el.tagName === "UL" || el.tagName === "OL") {
                tabsParent = el
            }
            if (el.tagName === "DIV") {
                tabpanels.push(el.childNodes)
                tabpanelIncludes.push(false)
            }
            element.removeChild(el)
        }

        for (var i = 0; el = tabsParent.children[i++];) {
            tabs.push(el.childNodes)
        }

        // 构建组建的ViewModel
        var vmodel = avalon.define(data.tabsId, function (vm) {
            vm.active = options.active
            vm.collapsible = options.collapsible
            vm.removable = options.removable
            vm.tabs = tabs
            vm.tabpanels = tabpanels
            vm.tabpanelIncludes = tabpanelIncludes
            vm.event = options.event
            vm.activate = function (e) {
                e.preventDefault()
                vm.active = this.$vmodel.$index
                options.activate.call(this, e, vmodel)
            }
            vm.add = function (config) {
                var title = config.title || 'Tab Tile'
                var content = config.content || '<div></div>'
                vm.tabs.push(title)
                if (config.includeSrc) {
                    content = config.includeSrc
                    vm.tabpanels.push(content)
                    vm.tabpanelIncludes.push(true)
                }
                else {
                    vm.tabpanelIncludes(false)
                    vm.tabpanels.push(content)

                }
                if (config.actived) {
                    avalon.nextTick(function () {
                        vm.active = vm.tabs.length - 1
                    })

                }
            }
            vm.remove = function (e) {
                e.preventDefault()
                var index = this.$vmodel.$index
                vm.tabs.removeAt(index)
                vm.tabpanels.removeAt(index)
                this.$vmodel.$index = 0
                avalon.nextTick(function () {
                    vm.active = 0
                })
            }
            vm.bottom = options.bottom
        })
/*
        avalon.nextTick(function () {
            //4 当这一波扫描过来,再将组建的DOM结构插入DOM树,并绑定ms-*属性,然后开始扫描
            //jquery ui的.ui-helper-clearfix 类不支持对IE6清除浮动，这时需要fix一下
            if (!avalon.ui.fixUiHelperClearfix && typeof styleEl.style.maxHeight == "undefined") {
                styleEl.styleSheet.cssText += ".ui-helper-clearfix {_zoom:1;}"
                avalon.ui.fixUiHelperClearfix = true
            }
            element.innerHTML = options.bottom ? panels + tablist : tablist + panels
            element.setAttribute("ms-class-1", "ui-tabs-collapsible:collapsible")
            element.setAttribute("ms-class-2", "tabs-bottom:bottom")
            avalon.scan(element, [vmodel].concat(vmodels))

        })*/
        return vmodel
    }
    avalon.ui.tabs.defaults = {
        active: 0, //默认打开第几个面板
        event: "click", //打开面板的事件，移过(mouseover)还是点击(click)
        collapsible: false,
        bottom: false, //按钮位于上方还是上方
        removable: false, //按钮的左上角是否出现X，用于移除按钮与对应面板
        activate: avalon.noop// 切换面板后触发的回调
    }
    avalon.ui.tabs.buildTemplate = function (vmodel, element, data, vmodels) {
        var styleEl = document.getElementById("avalonStyle")
        var $element = avalon(element)

        $element.addClass("ui-tabs ui-widget ui-widget-content ui-corner-all")

        // 设置动态模板
        var tablist = '<ul class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header"' +
            ' ms-class-ui-corner-bottom="bottom" ms-class-ui-corner-all="!bottom" ms-each-tab="tabs">' +
            '<li class="ui-state-default" ' +
            ' ms-class-0="ui-corner-top:!bottom"' +
            ' ms-class-1="ui-corner-bottom:bottom"' +
            ' ms-class-2="ui-tabs-active:active == $index"' +
            ' ms-class-3="ui-state-active:active == $index"' +
            ' ms-' + vmodel.event + '="activate"' +
            ' ms-hover="ui-state-hover"' + // float: left; margin: 0.4em 0.2em 0 0; cursor: pointer;这样jquery ui没有封装进去
            ' >{{tab|html}}<span ms-visible="removable" class="ui-icon ui-icon-close" style="float: left; margin: 0.4em 0.2em 0 0; cursor: pointer;"  ms-click="remove"></span></li></ul>';

        var panels = '<div ms-each-panel="tabpanels" ><div ms-if="!tabpanelIncludes[$index]" class="ui-tabs-panel ui-widget-content"' +
            ' ms-class="ui-corner-bottom:!bottom"' +
            ' ms-visible="active == $index" >{{panel|html}}</div><div  ms-if="tabpanelIncludes[$index] && active == $index" class="ui-tabs-panel ui-widget-content"' +
            ' ms-class="ui-corner-bottom:!bottom"' +
            ' ms-visible="active == $index" ms-include-src="panel" ></div></div>'
        //jquery ui的.ui-helper-clearfix 类不支持对IE6清除浮动，这时需要fix一下
        if (!avalon.ui.fixUiHelperClearfix && typeof styleEl.style.maxHeight == "undefined") {
            styleEl.styleSheet.cssText += ".ui-helper-clearfix {_zoom:1;}"
            avalon.ui.fixUiHelperClearfix = true
        }
        element.innerHTML = vmodel.bottom ? panels + tablist : tablist + panels
        element.setAttribute("ms-class-1", "ui-tabs-collapsible:collapsible")
        element.setAttribute("ms-class-2", "tabs-bottom:bottom")
        return element

    }
    return avalon
})
/*
 <div ms-ui="tabs">
 <ul>
 <li>xxxxxxxxxxxx</li>
 <li>yyyyyyyyyyyyy</li>
 <li>zzzzzzzzzzzz</li>
 </ul>
 <div>
 xxx 第1个面板
 </div>
 <div>
 xxx 第2个面板
 </div>
 <div>
 xxx 第3个面板
 </div>
 </div>



 */