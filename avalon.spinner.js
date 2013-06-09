(function(avalon) {
    var defaults = {
        value: 0,
        min: 1 << 31,
        max: Infinity,
        step: 1
    };
    avalon.ui.spinner = function(element, id) {
        var $element = avalon(element),
                model, el;
        var fragment = document.createDocumentFragment();
        //处理配置
        var options = avalon.mix({}, defaults);
        avalon.mix(options, $element.data());
        var span = document.createElement("span");
        span.className = "ui-spinner ui-widget ui-widget-content ui-corner-all";
        span.innerHTML = '<a class="ui-spinner-button ui-spinner-up ui-corner-tr ui-button ui-widget ui-state-default ui-button-text-only" tabindex="-1" >' +
                '<span  class="ui-button-text"><span class="ui-icon ui-icon-triangle-1-n">&#9650;</span></span></a>' +
                '<a  class="ui-spinner-button ui-spinner-down ui-corner-br ui-button ui-widget ui-state-default ui-button-text-only" tabindex="-1" >' +
                '<span  class="ui-button-text"><span class="ui-icon ui-icon-triangle-1-s">&#9660;</span></span></a>';
        $element.addClass("ui-spinner-input");

        element.autocomplete = "off";
        element.parentNode.insertBefore(span, element.nextSibling);
        fragment.appendChild(element);
        var buttons = [];
        while (el = span.firstChild) {
            if (el.tagName === "A") {
                buttons.push(el);
            }
            fragment.appendChild(el);
        }
        element.setAttribute("ms-value", "value");
        element = span;//偷天换日
        $element = avalon(span);
        model = avalon.define(id, function(vm) {
            vm.min = options.min;
            avalon.mix(vm, options );
            vm.addNumber = function(e) {
                e.preventDefault();
                vm.value += vm.step;
                if (vm.value > vm.max) {
                    vm.value = vm.max;
                }
            };
            vm.reduceNumber = function(e) {
                e.preventDefault();
                vm.value -= vm.step;
                if (vm.value < vm.min) {
                    vm.value = vm.min;
                }
            };
        });
        avalon.nextTick(function() {
            buttons[0].setAttribute("ms-click", "addNumber");
            buttons[1].setAttribute("ms-click", "reduceNumber");
            element.appendChild(fragment);
            avalon.scan(element, model);
        });
        return model;
    };
})(this.avalon);