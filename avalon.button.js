define(["avalon"], function(avalon) {
    var defaults = {
        disabled: false
    };
    avalon.ui.button = function(element, id, vmodels, opts) {

        var $element = avalon(element),
                model, el, checkbox;
        var title = element.title,
                html = element.innerHTML;
        element.title = "";
        var fragment = document.createDocumentFragment();
     
        //处理配置
        var options = avalon.mix({}, defaults, opts, $element.data());

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
            element = label;//  偷天换日
            $element = avalon(element);
        }
        while (el = element.firstChild) {
            fragment.appendChild(el);
        }
        $element.addClass("ui-button ui-widget ui-state-default");

        //如果使用了buttonset
     
        if (typeof options.cornerClass === "string") {
            $element.addClass(options.cornerClass);
        }else  if (options.cornerClass !== false) {
            $element.addClass("ui-corner-all");
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
        var iconClass = options.text === false ? "ui-button-icon-only" :
                typeof options.secondary === "string" ? "ui-button-text-icons" : 
                typeof options.primary === "string" ? "ui-button-text-icon-primary" : ""
        if (options.text === false) {
            element.title = title || html ;
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
                vm.checked = !!(checkbox || {}).checked;
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
            element.setAttribute("ms-class-0", "ui-state-disabled:disabled");
            element.setAttribute("ms-active" , activeClass+ ":!disabled");
            if (isCheckbox) {
                element.setAttribute("ms-class-1", "ui-state-active:checked");
                checkbox.setAttribute("ms-checked", "checked");
            }
            if (isRadio) {
                element.setAttribute("ms-class-2", "ui-state-active:radioActived == " + radioIndex);
                element.setAttribute("ms-checked", "radioActived == " + radioIndex);
            }
            if (toggleButton) {
                avalon.scan(checkbox, model);
            }
            avalon.scan(element, [model].concat(vmodels));
        });
        return model
    };

    avalon.ui.buttonset = function(element, id) {
        var $element = avalon(element);
        $element.addClass("ui-buttonset");
        var children = element.children;
        for (var i = 0, el; el = children[i++]; ) {
            el.setAttribute("data-corner-class", "true");
        }
        children[0].setAttribute("data-corner-class", "ui-corner-left");
        children[children.length - 1].setAttribute("data-corner-class", "ui-corner-right");
    };
    return avalon
})
/**
 data-primary="ui-icon-gear" 用于指定左边的ICON
 data-secondary="ui-icon-triangle-1-s" 用于指定右边的ICON

 data-corner-class="false" 不添加ui-corner-all圆角类名
 data-corner-class="conrer" 添加你指定的这个conrer圆角类名
 不写data-corner-class 添加ui-corner-all圆角类名

 button, a, span等标签，取其innerHTML作为UI内容，否则需要取其title

 data-text = false 决定其内部是否只显示图标
 * 
 * 
 */
        
//X-tag和Web组件帮你提速应用开发 http://mozilla.com.cn/post/51451/
