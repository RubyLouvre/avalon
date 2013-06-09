(function(avalon) {
    var defaults = {
        active: 0
    };
    avalon.ui.accordion = function(element, id) {
        var $element = avalon(element),
                model, el
        var fragment = document.createDocumentFragment();
        //处理配置
        var options = avalon.mix({}, defaults);
        avalon.mix(options, $element.data());
        $element.addClass(" ui-accordion ui-widget ui-helper-reset");
        var el, tabs = [],
                tabpanels = [];

        while (el = element.firstChild) {
            fragment.appendChild(el);
            if (el.tagName === "H3") {
                el.setAttribute("ms-hover", "ui-state-hover");
                el.setAttribute("ms-click", "activate");
                avalon(el).addClass("ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all");
                var icon = document.createElement("span");
                icon.className = "ui-accordion-header-icon ui-icon ui-icon-triangle-1-e";
                icon.setAttribute("ms-class-ui-icon-triangle-1-s", "active == " + tabs.length);
                icon.setAttribute("ms-class-ui-icon-triangle-1-e", "active != " + tabs.length);
                el.appendChild(icon);
                tabs.push(el);
            }
            if (el.tagName === "DIV") {
                el.setAttribute("ms-visible", "active == " + tabpanels.length);
                tabpanels.push(el);
                avalon(el).addClass(" ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom");
            }
        }
        var model = avalon.define(id, function(vm) {
            vm.active = options.active;
            vm.activate = function(e) {
                e.preventDefault();
                vm.active = tabs.indexOf(this);
            };
        });
        avalon.nextTick(function() {
            element.appendChild(fragment);
            avalon.scan(element, model);
        });
    }
})(this.avalon)