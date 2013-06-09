(function(avalon) {
    var defaults = {
        active: 0,
        event: "click", //可以使用click, mouseover
        collapsible: false,
        bottom: false,
        removable: false
    };
    avalon.ui.tabs = function(element, id, opts) {
        var el, tabsParent, tabs = [], tabpanels = [];
        var $element = avalon(element);
        //1,设置参数对象options = defaults + opts + $element.data()
        var options = avalon.mix({}, defaults);
        if (typeof opts === "object") {
            avalon.mix(options, opts.$json || opts);
        }
        avalon.mix(options, $element.data());
        
        $element.addClass("ui-tabs ui-widget ui-widget-content ui-corner-all");

        //2, 清空它内部所有节点，并收集其内容，构建成tabs与tabpanels两个数组
        while (el = element.firstChild) {
            if (!tablist && (el.tagName === "UL" || el.tagName === "OL")) {
                tabsParent = el;
            }
            if (el.tagName === "DIV") {
                tabpanels.push(el.innerHTML);
            }
            element.removeChild(el);
        }

        for (var i = 0; el = tabsParent.children[i++]; ) {
            tabs.push(el.innerHTML);
        }
        //3 设置动态模板
        var tablist = '<ul class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header"' +
                ' ms-class-ui-corner-all="!bottom"  ms-class-ui-corner-bottom="bottom" ms-each-tab="tabs">' +
                '<li class="ui-state-default" ' +
                ' ms-class-ui-corner-top="!bottom"' +
                ' ms-class-ui-corner-bottom="bottom"' +
                ' ms-class-ui-tabs-active="active == $index"' +
                ' ms-class-ui-state-active="active == $index"' +
                ' ms-' + options.event + '="activate"' +
                ' ms-hover="ui-state-hover"' + // float: left; margin: 0.4em 0.2em 0 0; cursor: pointer;这样jquery ui没有封装进去
                ' >{{tab|html}}<span class="ui-icon ui-icon-close" style="float: left; margin: 0.4em 0.2em 0 0; cursor: pointer;" ms-if="true" ms-click="remove"></span></li></ul>';
        var panels = '<div ms-each-panel="tabpanels" ><div class="ui-tabs-panel ui-widget-content"' +
                ' ms-class-ui-corner-bottom="!bottom"' +
                ' ms-visible="active == $index" >{{panel|html}}</div></div>';
        //4 构建组建的ViewModel
        var model = avalon.define(id, function(vm) {
            vm.active = options.active;
            vm.collapsible = options.collapsible;
            vm.tabs = tabs;
            vm.tabpanels = tabpanels;
            vm.removable = options.removable;
            vm.activate = function(e) {
                e.preventDefault();
                vm.active = this.$scope.$index;
            };
            vm.remove = function(e) {
                e.preventDefault();
                var index = this.$scope.$index;
                vm.tabs.removeAt(index);
                vm.tabpanels.removeAt(index);
                avalon.nextTick(function() {
                    vm.active = 0;
                });
            };
            vm.bottom = options.bottom;
        });
        
        avalon.nextTick(function() {
            //5 当这一波扫描过来,再将组建的DOM结构插入DOM树,并绑定ms-*属性,然后开始扫描
            element.innerHTML = options.bottom ? panels + tablist : tablist + panels;
            element.setAttribute("ms-class-ui-tabs-collapsible", "collapsible");
            element.setAttribute("ms-class-tabs-bottom", "bottom");
            avalon.scan(element, model);
        });
        return model;
    };
})(window.avalon);