define(["avalon"], function(avalon) {
    var defaults = {
        value: 0
    };
    avalon.ui.progressbar = function(element, id, vmodels, opts) {
        var $element = avalon(element),
                model, el
        var fragment = document.createDocumentFragment();
        //处理配置
        var options = avalon.mix({}, defaults,$element.data());
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
    return avalon
})
//6月2日 3群 上海-Jason
