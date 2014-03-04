define(["avalon"], function(avalon) {
    var styleEl = document.getElementById("avalonStyle")
    avalon.ui.tabs = function(element, data, vmodels) {
        var el, tabsParent, tabs = [], tabpanels = []
        var options = data.tabsOptions
        var $element = avalon(element)

        // 清空它内部所有节点，并收集其内容，构建成tabs与tabpanels两个数组
        while (el = element.firstChild) {
            if (el.tagName === "UL" || el.tagName === "OL") {
                tabsParent = el
            }
            if (el.tagName === "DIV") {
                tabpanels.push({
                    content: el.innerHTML,
                    contentType: 'content'
                })

            }
            element.removeChild(el)
        }

        for (var i = 0; el = tabsParent.children[i++]; ) {
            var tabOptions = avalon(el).data()
            tabs.push({
                title: el.innerHTML,
                removable: tabOptions.removable == undefined ? options.removable : tabOptions.removable,
                disabled: tabOptions.disabled == undefined ? false : tabOptions.disabled
            })
        }

        // 构建组建的ViewModel
        var vmodel = avalon.define(data.tabsId, function(vm) {
            vm.active = options.active
            vm.collapsible = options.collapsible
            vm.collapsed = false
            vm.removable = options.removable
            vm.tabs = tabs
            vm.tabpanels = tabpanels
            vm.event = options.event
            vm.activate = function(e, index) {
                e.preventDefault()
                if (vm.tabs[index].disabled === true) {
                    return
                }
                if (vm.event == 'click' && vm.active == index && vm.collapsible) {
                    vm.collapsed = !vm.collapsed
                    return
                }
                if (vm.collapsible) {
                    vm.collapsed = false
                }
                if (vm.event != index) {
                    avalon.nextTick(function() {
                        vm.active = index;
                        options.activate.call(this, e, vmodel)
                    })
                }
            }
            vm.collapse = function(e, index) {
                e.preventDefault()
                if (vm.tabs[index].disabled === true) {
                    return
                }
                if (vm.collapsible) {
                    vm.collapsed = !vm.collapsed
                }
            }
            vm.disable = function(index, disable) {
                disable = typeof disable == "undefined" ? true : disable
                if (!avalon.isArray(index)) {
                    index = [index]
                }
                var total = vm.tabs.length
                index.forEach(function(idx) {
                    if (idx >= 0 && total > idx) {
                        vm.tabs[idx].disabled = disable
                    }
                })
            }
            vm.enable = function(index) {
                vm.disable(index, false)
            }
            vm.add = function(config) {
                var title = config.title || 'Tab Tile'
                var content = config.content || '<div></div>'
                var exsited = false
                vm.tabpanels.forEach(function(panel) {
                    if (panel.contentType == 'include' && panel.content == config.content) {
                        exsited = true
                    }
                })
                if (exsited === true) {
                    return
                }
                vm.tabpanels.push({
                    content: content,
                    contentType: config.contentType

                })
                vm.tabs.push({
                    title: title,
                    removable: vm.removable,
                    disabled: false
                })

                if (config.actived) {
                    avalon.nextTick(function() {
                        vm.active = vm.tabs.length - 1
                    })

                }
            }
            vm.remove = function(e) {
                e.preventDefault()
                var index = this.$vmodel.$index
                if (vm.tabs[index].disabled === true) {
                    return
                }
                vm.tabs.removeAt(index)
                vm.tabpanels.removeAt(index)
                index = index > 1 ? index - 1 : 0
                avalon.nextTick(function() {
                    vm.active = index
                    vm.collapsed = false
                })
            }
            vm.bottom = options.bottom
        })
        avalon.nextTick(function() {

            $element.addClass("ui-tabs ui-widget ui-widget-content ui-corner-all")

            var collapse = options.event !== 'click' ? ' ms-click="collapse($event,$index)"' : ''

            // 设置动态模板
            var tablist = '<ul class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header"' +
                    ' ms-class-ui-corner-bottom="bottom" ms-class-ui-corner-all="!bottom" ms-each-tab="tabs">' +
                    '<li class="ui-state-default" ' +
                    ' ms-class-0="ui-corner-top:!bottom"' +
                    ' ms-class-1="ui-corner-bottom:bottom"' +
                    ' ms-class-2="ui-tabs-active:active == $index"' +
                    ' ms-class-3="ui-state-active:active == $index && !tab.disabled"' +
                    ' ms-class-4="ui-state-disabled:tab.disabled"' +
                    ' ms-' + options.event + '="activate($event,$index)"' + collapse +
                    ' ms-hover="ui-state-hover:!tab.disabled">' + // float: left; margin: 0.4em 0.2em 0 0; cursor: pointer;这样jquery ui没有封装进去
                    ' <a href="#">{{tab.title | html}}</a>' +
                    '<span ms-visible="tab.removable && !tab.disabled"' +
                    ' class="ui-icon ui-icon-close"' +
                    ' style="float: left; margin: 0.4em 0.2em 0 0; cursor: pointer;"' +
                    ' ms-click="remove"></span></li></ul>';

            var panels = '<div ms-each-panel="tabpanels" >' +
                    '<div ms-if="panel.contentType == \'content\' && active == $index"' +
                    ' class="ui-tabs-panel ui-widget-content"' +
                    ' ms-class="ui-corner-bottom:!bottom"' +
                    ' ms-visible="active == $index && !(collapsed && collapsible)" >{{panel.content | html}}' +
                    '</div>' +
                    '<div  ms-if="panel.contentType == \'include\' && active == $index"' +
                    ' class="ui-tabs-panel ui-widget-content"' +
                    ' ms-class="ui-corner-bottom:!bottom"' +
                    ' ms-visible="active == $index && !(collapsed && collapsible)"' +
                    ' ms-include-src="panel.content" >' +
                    '</div></div>'
            //jquery ui的.ui-helper-clearfix 类不支持对IE6清除浮动，这时需要fix一下
            if (!avalon.ui.fixUiHelperClearfix && typeof styleEl.style.maxHeight == "undefined") {
                styleEl.styleSheet.cssText += ".ui-helper-clearfix {_zoom:1;}"
                avalon.ui.fixUiHelperClearfix = true
            }
            element.innerHTML = vmodel.bottom ? panels + tablist : tablist + panels
            element.setAttribute("ms-class-1", "ui-tabs-collapsible:collapsible")
            element.setAttribute("ms-class-2", "tabs-bottom:bottom")
            avalon.scan(element, [vmodel].concat(vmodels))

        })
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