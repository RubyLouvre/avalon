define(["avalon.draggable"], function(avalon) {
    //判定是否触摸界面
    var defaults = {
        distance: 0,
        max: 100,
        min: 0,
        orientation: "horizontal",
        range: false,
        step: 1,
        value: 0,
        values: null
    }
    var domParser = document.createElement("div")

    avalon.ui["slider"] = function(element, id, vmodels, opts) {
        var $element = avalon(element)
        var options = avalon.mix({}, defaults, $element.data())

        var isHorizontal = options.orientation === "horizontal"
        //将整个slider划分为N等分, 比如100, 227
        var valueMin = options.min
        var valueMax = options.max
        var oRange = options.range //true min max
        var values = options.values
        var twohandlebars = oRange === true
        //处理
        var value = options.value //第几等份
        if (oRange === "min" && values) {
            var value = values[0]
        } else if (oRange === "max" && values) {
            value = values[1]
        }
        if (twohandlebars) {
            if (Array.isArray(values)) {
                values = values.length === 1 ? [values[0], values[0]] : values.concat()
            } else {
                values = [valueMin, valueMax]
            }
        }


        var handleHTML = '<b class="ui-slider-handle ui-state-default ui-corner-all"' +
                ' ms-css-' + (isHorizontal ? 'left' : 'bottom') + '="{{percent}}%"' +
                ' data-axis=' + (isHorizontal ? 'x' : 'y') +
                ' ms-draggable="dragend"' +
                ' data-start="dragstart"' +
                ' data-drag="drag"' +
                ' data-drag-x="false"'+
                ' data-drag-y="false"'+
                ' data-containment="parent"' +
                ' ms-hover="ui-state-hover"></b>'
        var rangeHTML = ' <div class="ui-slider-range ui-widget-header ui-corner-all"' +
                ' ms-class-ui-slider-range-max="range === \'max\'" ' +
                ' ms-class-ui-slider-range-min="range === \'min\'" ' +
                (twohandlebars ? ' ms-css-' + (isHorizontal ? 'left' : 'bottom') + '=" percent0 +\'%\'"' : "") +
                ' ms-css-' + (isHorizontal ? 'width' : 'height') + '="{{ range === \'max\'  ? 100 - percent : percent}}%"></div>'
        var sliderHTML = '<div class="ui-slider  ui-slider-' + options.orientation +
                ' ui-widget ui-widget-content ui-corner-all" ' +
                ' ms-class-ui-state-disabled="disabled" >' +
                (oRange ? rangeHTML : "") + (twohandlebars ? handleHTML.replace("percent", "percent0") +
                handleHTML.replace("percent", "percent1") : handleHTML) +
                '</div>'
      //  console.log( $element.data())
    console.log(sliderHTML)
        domParser.innerHTML = sliderHTML
        var slider = domParser.removeChild(domParser.firstChild)
        var a = slider.getElementsByTagName("b"), handlers = []
        for (var i = 0, el; el = a[i++]; ) {
            handlers.push(el)
        }
        element.parentNode.insertBefore(slider, element.nextSibling)
        $element.addClass("ui-helper-hidden-accessible")
        var Index = 0, pixelTotal
        function value2Percent(val) {
            if (val < valueMin) {
                val = valueMin
            }
            if (val > valueMax) {
                val = valueMax
            }
            return parseFloat((val / valueMax * 100).toFixed(5))
        }
        function percent2Value(percent) {//0~1
            var val = valueMax * percent
            var step = (options.step > 0) ? options.step : 1

            var valModStep = val % step
            var n = val / step
            val = valModStep * 2 >= step ? step * Math.ceil(n) : step * Math.floor(n)

            return parseFloat(val.toFixed(3))
        }
        var model = avalon.define(id, function(vm) {
            vm.disabled = element.disabled
            vm.percent = twohandlebars ? value2Percent(values[1] - values[0]) : value2Percent(value)
            vm.percent0 = twohandlebars ? value2Percent(values[0]) : 0
            vm.percent1 = twohandlebars ? value2Percent(values[1]) : 0
            vm.value = twohandlebars ? values.join() : value
            vm.range = oRange
           // console.log(vm.range)
            vm.values = values
            vm.dragstart = function(event, data) {
                Index = handlers.indexOf(data.element)
                data.$element.addClass("ui-state-active")
                pixelTotal = isHorizontal ? slider.offsetWidth : slider.offsetHeight
            }
            vm.dragend = function(event, data) {
                data.$element.removeClass("ui-state-active")
            }
            vm.drag = function(event, data) {
                var prop = isHorizontal ? "left" : "top"       
                var pixelMouse = data[prop]
                //如果是垂直时,往上拖,值就越大
                var percent = (pixelMouse / pixelTotal) //求出当前handler在slider的位置
                if (!isHorizontal) {
                    percent = Math.abs(1 - percent)
                }
                if (percent > 0.99) {
                    percent = 1
                }
                if (percent < 0.01) {
                    percent = 0
                }
              
                var val = percent2Value(percent)
                if (twohandlebars) { //水平时，小的0在左边，大的1在右边，垂直时，大的0在下边，小的1在上边
                    if (Index === 0) {
                        var check = model.values[1]
                        if (val > check) {
                            val = check
                        }
                    } else {
                        check = model.values[0]
                        if (val < check) {
                            val = check
                        }
                    }
                    model.values[Index] = val
                    model["percent" + Index] = value2Percent(val)
                    model.value = model.values.join()
                    model.percent = value2Percent(model.values[1] - model.values[0])
                } else {
                    model.value = val
                // console.log(model.value)
                    model.percent = value2Percent(val)
                }
            }

        })

        avalon.scan(slider, model)
        return model
    }

    return avalon
})
//http://xinranliu.me/?p=520
//http://www.w3cplus.com/css3/using-flexbox.html
//http://www.w3cplus.com/css3/css-generated-content-counters.html