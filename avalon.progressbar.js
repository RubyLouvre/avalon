define(["avalon"], function(avalon) {

    var widget = avalon.ui.progressbar = function(element, data, vmodels) {
        var $element = avalon(element), options = data.progressbarOptions, model, el
        $element.addClass("ui-progressbar ui-widget ui-widget-content ui-corner-all")
        element.innerHTML = '<div class="ui-progressbar-value ui-widget-header ui-corner-left ui-corner-right" ms-attr-id=progressbar' + data.progressbarId + ' style="width:' + options.value + '%;"></div>'
        var fragment = document.createDocumentFragment()
        while (el = element.firstChild) {
            fragment.appendChild(el)
        }
        model = avalon.define(data.progressbarId, function(vm) {
            vm.value = options.value
            vm.$watch("value", function(v) {
                if (isFinite(v)) {
                    var el = document.getElementById("progressbar" + model.$id)
                    if (el) {
                        el.style.width = v + "%"
                    }
                }
            })
        })
        avalon.nextTick(function() {
            element.appendChild(fragment)
            avalon.scan(element, [model].concat(vmodels))
        })
        return model
    }
    widget.defaults = {
        value: 0
    }
    return avalon
})
/*
 <div ms-widget="progressbar" data-progressbar-value="37" style="width:50%"></div>
 */
