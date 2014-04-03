//avalon 1.2.5 2014.4.2
define(["avalon"], function(avalon) {
    var lastActive
    var baseClasses = "ui-button ui-widget ui-state-default"
    var typeClasses = "ui-button-icons-only ui-button-icon-only ui-button-text-icons ui-button-text-icon-primary ui-button-text-icon-secondary ui-button-text-only"
    var widget = avalon.ui.button = function(element, data, vmodels) {

        var options = data.buttonOptions

        if (element.type === "radio") {
            options.$radio = {}
        }
        function stop(event) {
            if (options.disabled) {
                event.preventDefault()
                event.stopImmediatePropagation()
            }
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
                //如果使用了buttonset
                options.baseClasses = baseClasses
                if (typeof options.cornerClass === "string") {
                    options.baseClasses += (" " + options.cornerClass)
                } else if (options.cornerClass !== false) {
                    options.baseClasses += " ui-corner-all"
                }
                var $button = avalon(buttonElement).addClass(options.baseClasses)
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
                                stop(event)
                                $button.addClass("ui-state-active")
                            })
                            .bind("mouseup", function(event) {
                                stop(event)
                                $button.removeClass("ui-state-active")
                            })
                            .bind("blur", function() {
                                $button.removeClass("ui-state-active");
                            })
                }
                if (!vm.label) {
                    vm.label = vm.$type === "input" ? buttonElement.value : buttonElement.innerHTML
                }

                $button
                        .bind("focus", function() {
                            $button.removeClass("ui-state-focus");
                        })
                        .bind("blur", function() {
                            $button.removeClass("ui-state-focus");
                        })

                vm.$resetButton()

                avalon.scan(buttonElement, [vmodel].concat(vmodels))

            }
            vm.$remove = function() {
                avalon(element)
                        .removeClass("ui-helper-hidden-accessible")
                var button = vm.buttonElement
                avalon(button)
                        .removeClass(options.baseClasses + " ui-state-active " + typeClasses)

                button.innerHTML = vm.label

                if (!vm.hasTitle) {
                    button.title = ""
                }
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
                stop(event)
                if (typeof options.click === "function") {
                    options.click.call(vmodels.buttonElement, event, vmodel)
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
                        buttonText = "<span class='ui-button-icon-primary ui-icon' ms-class='{{iconPrimary}}'></span>" + buttonText
                    }

                    if (iconSecondary) {
                        buttonText += "<span class='ui-button-icon-secondary ui-icon' ms-class='{{iconSecondary}}'></span>"
                    }

                    if (!vm.text) {
                        buttonClasses.push(multipleIcons ? "ui-button-icons-only" : "ui-button-icon-only")
                        if (!vm.hasTitle) {
                            buttonElement.setAttribute("ms-title", "label")
                        }
                    }
                } else {
                    buttonClasses.push("ui-button-text-only")
                }

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
        text: true,//决定是否使用 ui-button-icons-only ui-button-icon-only ui-button-text-only
        label: "",
        iconPrimary: "",
        iconSecondary: ""
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

    avalon.ui.buttonset = function(element, data, vmodels) {
        return {
            $init: function() {
                avalon(element).addClass("ui-buttonset")
                var children = element.childNodes, buttons = []
                for (var i = 0, el; el = children[i++]; ) {
                    if (el.nodeType === 1 && (/^(button|input|a)$/i.test(el.tagName) || el.getAttribute("data-button"))) {
                        el.setAttribute("data-button-corner-class", "false")
                        buttons.push(el)
                    }
                }
                var n = buttons.length
                if (n) {
                    buttons[0].setAttribute("data-button-corner-class", "ui-corner-left")
                    buttons[n - 1].setAttribute("data-button-corner-class", "ui-corner-right")
                }
                data.buttons = buttons
                avalon.scan(element, vmodels)
            },
            $remove: function(el) {
                avalon(element).removeClass("ui-buttonset")
                while (el = data.buttons.pop()) {
                    el.removeAttribute("data-button-corner-class")
                }
                delete data.buttons
            }
        }
    }

    return avalon
})
/**
 data-button-icon-primary="ui-icon-gear" 用于指定左边的ICON
 data-button-icon-secondary="ui-icon-triangle-1-s" 用于指定右边的ICON
 
 data-button-corner-class="false" 不添加ui-corner-all圆角类名
 data-button-corner-class="conrer" 添加你指定的这个conrer圆角类名
 
 不写data-button-corner-class 添加ui-corner-all圆角类名
 
 button, a, span[data-button]等标签，取其innerHTML作为UI内容，否则需要取其title
 
 data-button-text = false 决定其内部是否只显示图标
 
 data-button-label="xxx" 指定内容
      
click 回凋，this为生成的按钮，第一个传参为事件对象， 第二个为控件VM
        
 */