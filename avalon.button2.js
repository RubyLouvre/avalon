define(["avalon"], function(avalon) {
    var lastActive
    var baseClasses = "ui-button ui-widget ui-state-default ui-corner-all"
    var typeClasses = "ui-button-icons-only ui-button-icon-only ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary ui-button-text-only"
    var widget = avalon.ui.button = function(element, data, vmodels) {

        var options = data.buttonOptions

        if (element.type === "radio") {
            options.$radio = {}
        }

        var vmodel = avalon.define(data.buttonId, function(vm) {

            avalon.mix(vm, options)
            // vm.$radioId = ("radio" + Math.random()).replace("0.","")
            vm.$skipArray = ["text", "hasTitle", "icons"]
            vm.buttonElement = element
            vm.$init = function() {
                if (typeof options.disabled !== "boolean") {
                    options.disabled = !!element.disabled
                } else {
                    element.disabled = options.disabled
                }
                vm.$determineButtonType()
                var buttonElement = vm.buttonElement

                vm.hasTitle = !!buttonElement.getAttribute("title")
                var vmType = vm.$type
                var toggleButton = vmType === "checkbox" || vmType === "radio"
                var $button = avalon(buttonElement)
                options.activeClass = !toggleButton ? "ui-state-active" : ""
                if (toggleButton) {
                    avalon(element).bind("change", function() {
                        if (vmType === "radio") {
                            if (this.checked) {
                                vmodel.$radio.active = data.buttonId
                            }
                        } else if (vmType === "checkbox") {
                            avalon(vmodel.buttonElement).toggleClass("ui-state-active", this.checked)
                        }
                    })
                }

                buttonElement.setAttribute("ms-hover", "ui-state-hover")
                buttonElement.setAttribute("ms-mouseenter", "$mouseenter")

                buttonElement.setAttribute("ms-mouseleave", "$mouseleave")
                buttonElement.setAttribute("ms-click", "$click")

                if (vmType === "radio") {
                    //radio组都共享一个VM，实现切换效果
                    buttonElement.setAttribute("ms-class-3", "ui-state-active:$radio.active == '" + data.buttonId + "'")
                } else if (vmType === "button" || vmType === "input") {
                    $button
                            .bind("mousedown", function(event) {
                                vmodel.$click(event)
                                $button.addClass("ui-state-active")
                            })
                            .bind("mouseup", function(event) {
                                vmodel.$click(event)
                                $button.removeClass("ui-state-active")
                            })
                            .bind("keydown", function(event) {
                                vmodel.$click(event)
                                if (event.which === 8 || event.which === 13) {
                                    $button.addClass("ui-state-active");
                                }
                            })
                            .bind("keyup", function() {
                                $button.removeClass("ui-state-active");
                            })
                            .bind("blur", function() {
                                $button.removeClass("ui-state-active");
                            })

                    if (buttonElement.tagName === "A") {
                        $button.bind("keyup",function(event) {
                            if (event.which === 8) {
                                // TODO pass through original event correctly (just as 2nd argument doesn't work)
                                this.click();
                            }
                        });
                    }
                }
                if (!vm.label) {
                    vm.label = vm.$type === "input" ? buttonElement.value : buttonElement.innerHTML
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

                var buttonText = '<span class="ui-button-text">{{label | html}}</span>'
                var iconPrimary = vm.iconPrimary
                var iconSecondary = vm.iconSecondary
                var multipleIcons = iconPrimary && iconSecondary
                var buttonClasses = []
                if (iconPrimary || iconSecondary) {
                    if (options.text) {
                        buttonClasses.push("ui-button-text-icon" + (multipleIcons ? "s" : (iconPrimary ? "-primary" : "-secondary")))
                    }

                    if (iconPrimary) {
                        buttonText = "<span class='ui-button-icon-primary ui-icon " + iconPrimary + "'></span>" + buttonText
                    }

                    if (iconSecondary) {
                        buttonText += "<span class='ui-button-icon-secondary ui-icon " + iconSecondary + "'></span>"
                    }

                    if (!vm.text) {
                        buttonClasses.push(multipleIcons ? "ui-button-icons-only" : "ui-button-icon-only")
                        if (!vm.hasTitle) {
                            buttonElement.title = vm.label.trim()
                        }
                    }
                } else {
                    buttonClasses.push("ui-button-text-only")
                }
                //  console.log(buttonText)
                buttonElement.innerHTML = buttonText
                avalon(buttonElement).addClass(buttonClasses.join(" "))
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
                            if (elementType === "radio") {
                                var form = element.form || document.body
                                var id = form.getAttribute("data-radio-id")
                                if (!id) {
                                    id = (new Date - 0) + ""
                                    form.setAttribute("data-radio-id", id)
                                }
                                var radioGroupId = "proxy" + id + element.name
                                if (!avalon.vmodels[radioGroupId]) {
                                    avalon.define(radioGroupId, function(vm) {
                                        vm.active = ""
                                    })
                                }
                                vmodel.$radio = avalon.vmodels[radioGroupId]

                            }
                            avalon(element).addClass("ui-helper-hidden-accessible")
                            if (element.checked) {
                                avalon(vmodel.buttonElement).addClass("ui-state-active")
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
        hasTitle: false,
        text: true,
        label: "",
        iconPrimary: null,
        iconSecondary: null
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
 data-button-primary="ui-icon-gear" 用于指定左边的ICON
 data-button-secondary="ui-icon-triangle-1-s" 用于指定右边的ICON
 
 data-button-corner-class="false" 不添加ui-corner-all圆角类名
 data-button-corner-class="conrer" 添加你指定的这个conrer圆角类名
 不写data-corner-class 添加ui-corner-all圆角类名
 
 button, a, span等标签，取其innerHTML作为UI内容，否则需要取其title
 
 data-button-text = false 决定其内部是否只显示图标
 * 
 */