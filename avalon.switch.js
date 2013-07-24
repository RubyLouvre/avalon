define(["avalon"], function(avalon) {
    //判定是否触摸界面
    var defaults = {
        disabled: false,
        leftText: "ON",
        rightText: "OFF"
    };
    var domParser = document.createElement("div");

    domParser.innerHTML = "#<style>.white-gradient{background-color: #ffffff;" +
            "background-image: linear-gradient(to bottom, #ffffff, #e6e6e6);" +
            "background-image: -moz-linear-gradient(top, #ffffff, #e6e6e6);" +
            "background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#ffffff), to(#e6e6e6);" +
            "background-image: -webkit-linear-gradient(top, #ffffff, #e6e6e6);" +
            "background-image: -o-linear-gradient(top, #ffffff, #e6e6e6);" +
            "background-repeat: repeat-x;}</style>";
    var style = domParser.removeChild(domParser.lastChild);
    avalon.ready(function() {
        var head = document.head || document.getElementsByTagName("head")[0];
        head.appendChild(style);
    });
    avalon.ui["switch"] =  function(element, id, vmodels, opts) {

        var $element = avalon(element);
        var options = avalon.mix({}, defaults);
        if (typeof opts === "object") {
            for (var i in opts) {
                if (i === "$id")
                    continue;
                options[i] = opts[i];
            }
        }
        avalon.mix(options, $element.data());

        var buttonClass = "ui-button ui-button-text-only ui-corner-left ui-state-active ui-state-default ui-widget";
        var buttonHTML = '<label  class="' + buttonClass + '" ms-click="changeState"><span class="ui-button-text" ms-html="leftText"></span></label>';
        var silderHTML = '<label ms-class-ui-state-disabled="disabled" class="ui-button ui-widget ui-button-text-only white-gradient" '
                + ' ms-draggable data-axis="x" data-dragend="dragend" data-beforestart="beforestart" '
                + ' ms-class-ui-corner-left="checked" '
                + ' ms-class-ui-corner-right="!checked" '
                + ' ms-css-left="sleft" '
                + ' ms-css-width="swidth" style="position:absolute;cursor:move;top:1px;"><span class="ui-button-text">&nbsp;</span></label>';
        var switchHTML = '<div class="ui-buttonset" style="position:relative;display:inline-block;_zoom:1;">' + buttonHTML +
                buttonHTML.replace(/left/g, "right").replace("ui-state-active", "") + silderHTML + '</div>';

        $element.addClass("ui-helper-hidden-accessible");
        domParser.innerHTML = switchHTML;

        var switcher = domParser.removeChild(domParser.firstChild);

        var labels = switcher.getElementsByTagName("label");
        var leftBtn = labels[0], rightBtn = labels[1];

        var model = avalon.define(id, function(vm) {

            avalon.mix(vm, options);
            vm.checked = element.checked;
            vm.changeState = function() {
                vm.checked = !vm.checked;
            };
            vm.beforestart = function(e, data) {
                var o = avalon(switcher).offset();
                data.containment = [o.left, o.top, o.left + switcher.offsetWidth, o.top + switcher.offsetHeight];
            };
            vm.$watch("checked", function(a) {
                if (a) {
                    vm.sleft = 0;
                    vm.swidth = leftBtn.clientWidth;
                } else {
                    vm.sleft = leftBtn.clientWidth - 2;
                    vm.swidth = rightBtn.clientWidth;
                }
            });
            vm.sleft = 0;
            vm.swidth = 0;
            vm.dragend = function(event, data) {
                vm.checked = !(data.left > leftBtn.clientWidth);
            };
        });
        avalon.nextTick(function() {
            element.parentNode.insertBefore(switcher, element.previousSibling);
            avalon.scan(switcher, model);
            avalon.nextTick(function() {
                var a = model.checked;
                model.checked = NaN;
                model.checked = a;
            })
        });
    };

    return avalon
})

