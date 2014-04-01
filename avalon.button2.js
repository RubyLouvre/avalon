define(["avalon"], function(avalon) {
    var lastActive,
            baseClasses = "ui-button ui-widget ui-state-default ui-corner-all",
            typeClasses = "ui-button-icons-only ui-button-icon-only ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary ui-button-text-only"
    var widget = avalon.ui.button = function(element, data, vmodels) {
        var $element = avalon(element), title = element.title,
                html = element.innerHTML, model, el, checkbox;
        var options = data.buttonOptions //valon.mix({}, defaults, opts, $element.data())
        console.log("11111111111111111")

        var vmodel = avalon.define(data.buttonId, function(vm) {
            
            avalon.mix(vm, options)
            vm.$skipArray= [ "text", "label","icons"]
            vm.buttonElement = element
            vm.$init = function() {
                if (typeof options.disabled !== "boolean") {
                    options.disabled = !!element.disabled
                } else {
                    element.disabled = options.disabled
                }
                vm.$determineButtonType()
                var buttonElement = vm.buttonElement
                console.log(buttonElement)
                vm.$hasTitle = !!buttonElement.getAttribute("title");
                var toggleButton = vm.$type === "checkbox" || vm.$type === "radio"
                options.activeClass = !toggleButton ? "ui-state-active" : "";

                buttonElement.setAttribute("ms-hover", "ui-state-hover")
                buttonElement.setAttribute("ms-mouseenter", "$mouseenter")
                buttonElement.setAttribute("ms-mouseleave", "$mouseleave")
                buttonElement.setAttribute("ms-click", "$click")
                if (options.label === null) {
                    options.label = vm.$type === "input" ? buttonElement.value : buttonElement.innerHTML
                }

                var $button = avalon(buttonElement).addClass(baseClasses)

                options.focusCallback = avalon.bind(buttonElement, "focus", function() {
                    $button.addClass("ui-state-focus")
                })

                options.blurCallback = avalon.bind(buttonElement, "blur", function() {
                    $button.removeClass("ui-state-focus")
                })
                vm.$resetButton()
                avalon.scan(buttonElement, [vmodel].concat(vmodels))

            }
            vm.$mouseenter = function() {
                if (options.disabled) {
                    return
                }
                if (this === lastActive) {
                    avalon(this).addClass("ui-state-active")
                }
            }

            vm.$mouseleave = function() {
                if (options.disabled) {
                    return
                }
                avalon(this).removeClass(options.activeClass)
            }

            vm.$click = function(event) {
                if (options.disabled) {
                    event.preventDefault()
                    event.stopImmediatePropagation()
                }
            }
            //改变按钮的外观
            vm.$resetButton = function() {
                if (vm.$type === "input") {
                    if (options.label) {
                        avalon(element).val(options.label)
                    }
                    return
                }

                var buttonElement = avalon(vm.buttonElement).removeClass(typeClasses)[0]
                var span = document.createElement("span")
                span.className = "ui-button-text"
                span.innerHTML = options.label
                vm.buttonElement.innerHTML = ""
                buttonElement.appendChild(span)
                var buttonText = span.innerHTML
                var icons = options.icons
                var multipleIcons = icons.primary && icons.secondary
                var buttonClasses = []
                if (icons.primary || icons.secondary) {
                    if (options.text) {
                        buttonClasses.push("ui-button-text-icon" + (multipleIcons ? "s" : (icons.primary ? "-primary" : "-secondary")));
                    }

                    if (icons.primary) {
                        var icon = avalon.parseHTML("<span class='ui-button-icon-primary ui-icon " + icons.primary + "'></span>")
                        buttonElement.insertBefore(icon, buttonElement.firstChild);
                    }

                    if (icons.secondary) {
                        var icon = avalon.parseHTML("<span class='ui-button-icon-secondary ui-icon " + icons.secondary + "'></span>")
                        buttonElement.appendChild(icon);
                    }

                    if (!this.options.text) {
                        buttonClasses.push(multipleIcons ? "ui-button-icons-only" : "ui-button-icon-only");

                        if (!this.hasTitle) {
                            buttonElement.title = buttonText.trim()
                        }
                    }
                } else {
                    buttonClasses.push("ui-button-text-only");
                }
                avalon(buttonElement).addClass(buttonClasses.join(" "));
            }

            vm.$determineButtonType = function() {

                if (element.tagName.toLowerCase() === "input") {
                    var elementType = element.type
                    switch (elementType) {
                        case "checkbox":
                        case "radio":
                            vmodel.$type = elementType
                            var ancestor = element.parentNode
                            var id = element.id
                            if (id) {
                                vmodel.buttonElement = findButtonElement(ancestor, id)
                                if (!vmodel.buttonElement) {
                                    vmodel.buttonElement = findButtonElement(ancestor.parentNode, id)
                                }
                            }
                            avalon(element).addClass("ui-helper-hidden-accessible")
                            if (element.checked) {
                                avalon(vmodel.buttonElement).addClass("ui-state-active");
                            }
                            break
                        default:
                            vmodel.$type = "input"
                            break
                    }
                } else {
                    vmodel.$type = "button"
                }
            }
        })
        return vmodel

    }

    widget.defaults = {
        $type: "",
        $hasTitle: false,
        text: true,
        label: null,
        icons: {
            primary: null,
            secondary: null
        }
    }


    function findButtonElement(elem, id) {
        var nodes = elem.getElementsByTagName("label")
        for (var i = 0, node; node = nodes[i++]; ) {
            if (node.htmlFor === id) {
                return node
            }
        }
        return  null
    }



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
 */