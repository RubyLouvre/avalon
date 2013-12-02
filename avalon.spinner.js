define(["avalon", "avalon.button"], function(avalon) {

    var widget = avalon.ui.spinner = function(element, data, vmodels) {
        var $element = avalon(element),options = data.spinnerOptions,
                model, el
        var fragment = document.createDocumentFragment()
        //这才是真正的UI
        var span = document.createElement("span")
        span.className = "ui-spinner ui-widget ui-widget-content ui-corner-all"
        span.innerHTML = '<a class="ui-spinner-button ui-spinner-up ui-corner-tr" ms-widget="button" data-button-corner-class="false"  data-button-primary="ui-icon ui-icon-triangle-1-n">&#9650;</a>' +
                '<a class="ui-spinner-button ui-spinner-down ui-corner-br" ms-widget="button"  data-button-corner-class="false" data-button-primary="ui-icon ui-icon-triangle-1-s" >&#9660;</a>'
        $element.addClass("ui-spinner-input")

        element.autocomplete = "off"
        model = avalon.define(data.spinnerId, function(vm) {
            vm.min = options.min
            avalon.mix(vm, options)
            vm.addNumber = function(e) {
                e.preventDefault()
                vm.value += vm.step
                if (vm.value > vm.max) {
                    vm.value = vm.max
                }
            }
            vm.reduceNumber = function(e) {
                e.preventDefault()
                vm.value -= vm.step
                if (vm.value < vm.min) {
                    vm.value = vm.min
                }
            }
        })
        avalon.nextTick(function() {
            element.parentNode.insertBefore(span, element.nextSibling)
            fragment.appendChild(element)
            var buttons = []
            while (el = span.firstChild) {
                if (el.tagName === "A") {
                    buttons.push(el)
                }
                fragment.appendChild(el)
            }
            element.setAttribute("ms-attr-value", "value")
            element = span//偷天换日

            buttons[0].setAttribute("ms-click", "addNumber")
            buttons[1].setAttribute("ms-click", "reduceNumber")
            element.appendChild(fragment)
            avalon.scan(element, [model].concat(vmodels))
        })
        return model
    }
    widget.defaults = {
        value: 0,
        min: 1 << 31,
        max: Infinity,
        step: 1
    }
    return avalon
})
/*
 <input ms-ui="spinner" name="value" />
 */