(function(avalon) {
    var defaults = {
        value: 0
    };
    avalon.ui.progressbar = function(element, id) {
        var $element = avalon(element),
                model, el
        var fragment = document.createDocumentFragment();
        //处理配置
        var options = avalon.mix({}, defaults);
        avalon.mix(options, $element.data());
        $element.addClass("ui-progressbar ui-widget ui-widget-content ui-corner-all");
        while (el = element.firstChild) {
            fragment.appendChild(el);
        }
        element.innerHTML = '<div class="ui-progressbar-value ui-widget-header ui-corner-left ui-corner-right" ms-bind-value="updateValue" style="width:' + options.value + '%;"></div>';
        while (el = element.firstChild) {
            fragment.appendChild(el);
        }
        model = avalon.define(id, function(vm) {
            vm.value = options.value;
            vm.updateValue = function(v){
                if(isFinite(v)){
                    this.style.width = v + "%"
                }
            }
        });
        avalon.nextTick(function() {
            element.appendChild(fragment);
            avalon.scan(element.parentNode, model);
        });
        return model;
    }
})(this.avalon);
//6月2日 3群 上海-Jason
