(function(avalon) {
    var defaults = {
        disabled: false
    };
    avalon.ui.button = function(element, id) {

        var $element = avalon(element),
            model, el, checkbox;
        var title = element.title,
            html = element.innerHTML;
        var fragment = document.createDocumentFragment();
        element.title = "";
        //处理配置
        var options = avalon.mix({}, defaults);
        avalon.mix(options, $element.data());
        //处理radio, checkbox
        var isRadio = element.type === "radio";
        var isCheckbox = element.type === "checkbox";
        var radios = [];
        if (isRadio && element.parentNode.$radio) {
            model = element.parentNode.$radio;
            radios = model.$radios;
        }
        var radioIndex = radios.length;
        var toggleButton = isCheckbox || isRadio;
        var activeClass = !toggleButton ? "ui-state-active" : "";
        if (toggleButton) { //偷天换日，用label代替原来的input[type=checkbox]，input[type=checkbox]
            var label = document.createElement("label");
            checkbox = element;
            label.innerHTML = options.label || checkbox.value;
            checkbox.parentNode.insertBefore(label, checkbox.nextSibling);
            $element.addClass("ui-helper-hidden-accessible");
            element = label;
            $element = avalon(element);
        }
        while (el = element.firstChild) {
            fragment.appendChild(el);
        }
        $element.addClass("ui-button ui-widget ui-state-default");

        element.title = title;

        //如果使用了buttonset
        if (!options.cornerClass) {
            $element.addClass("ui-corner-all");
        }
        if (typeof options.cornerClass === "string") {
            $element.addClass(options.cornerClass);
        }

        //创建按钮的内部，将它原来的内部放到一个span.ui-button-text
        if (fragment.childNodes.length) {
            var span = document.createElement("span");
            span.className = "ui-button-text";
            while (fragment.firstChild) {
                span.appendChild(fragment.firstChild);
            }
            $element.addClass("ui-button-text-only");
            fragment.appendChild(span);
        }
        //如果指定了icon， icon也占用一个span
        var iconClass = options.text === false ? "ui-button-icon-only" : typeof options.secondary === "string" ? "ui-button-text-icons" : typeof options.primary === "string" ? "ui-button-text-icon-primary" : ""
        if (options.text === false) {
            element.title = title || html;
        }
        if (iconClass) {
            $element.addClass(iconClass);
        }
        if (options.primary) {
            $element.removeClass("ui-button-text-only");
            var span = document.createElement("span");
            span.className = options.primary + " ui-button-icon-primary ui-icon";
            fragment.insertBefore(span, fragment.firstChild);
        }
        if (options.secondary) {
            $element.removeClass("ui-button-text-only");
            var span = document.createElement("span");
            span.className = options.secondary + " ui-button-icon-secondary ui-icon";
            fragment.appendChild(span);
        }

        $element.bind("mousedown", function(e) {
            if (model.disabled) {
                return false;
            }
            $element.addClass(activeClass);
        });
        $element.bind("mouseup", function(e) {
            if (model.disabled) {
                return false;
            }
            $element.removeClass(activeClass);
        });
        if (isCheckbox) {
            $element.bind("click", function() {
                model.checked = !model.checked
            });
        }
        if (isRadio) {
            $element.bind("click", function() {
                model.radioActived = radioIndex;
            });
        }
        if (!model) {
            model = avalon.define(id, function(vm) {
                vm.disabled = options.disabled;
                vm.radioActived = 0;
                vm.checked = !! (checkbox || {}).checked;
                vm.$radios = [];
            });
        }
        if (isRadio) {
            element.parentNode.$radio = model;
            model.$radios.push(element);
        }
        avalon.nextTick(function() {
            if (element.tagName !== "INPUT") {
                element.appendChild(fragment);
            }
            element.setAttribute("ms-hover", "ui-state-hover");
            element.setAttribute("ms-class-ui-state-disabled", "disabled");
            if (isCheckbox) {
                element.setAttribute("ms-class-ui-state-active", "checked");
                checkbox.setAttribute("ms-checked", "checked");
            }
            if (isRadio) {
                element.setAttribute("ms-class-ui-state-active", "radioActived == " + radioIndex);
                element.setAttribute("ms-checked", "radioActived == " + radioIndex);
            }
            if (toggleButton) {
                avalon.scan(checkbox, model);
            }
            avalon.scan(element, model);
        });
        return model
    };
})(window.avalon);

(function(avalon) {
    avalon.ui.buttonset = function(element, id) {
        var $element = avalon(element);
        $element.addClass("ui-buttonset");
        var children = element.children;
        for (var i = 0, el; el = children[i++];) {
            el.setAttribute("data-corner-class", "true");
        }
        children[0].setAttribute("data-corner-class", "ui-corner-left");
        children[children.length - 1].setAttribute("data-corner-class", "ui-corner-right");
    };
})(window.avalon);
//X-tag和Web组件帮你提速应用开发 http://mozilla.com.cn/post/51451/
