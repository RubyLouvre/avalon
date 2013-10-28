define(["avalon", "css!avalon.select.css"], function(avalon) {
    //判定是否触摸界面
    var defaults = {
        minWidth: 225,
        height: 175,
        toggle: false,
        caption: "请选择",
        selectedIndex: 0,
        checkAllText: "全选",
        unCheckAllText: "全不选",
        onChange: avalon.noop,
        onOpen: avalon.noop,
        onClose: avalon.noop
    }

    avalon.ui["select"] = function(element, id, vmodels, opts) {
        var $element = avalon(element)
        var options = avalon.mix({}, defaults, opts, $element.data())
        var buttonHTML = '<button type="button" ms-hover="ui-state-hover" ms-active="ui-state-focus"  ms-click="toggleMenu" class="ui-multiselect ui-widget ui-state-default ui-corner-all" aria-haspopup="true" >' +
                '<span class="ui-icon ui-icon-triangle-2-n-s"></span><span>{{caption}}</span></button>'
        var button = avalon.parseHTML(buttonHTML).firstChild
        button.style.minWidth = options.minWidth + "px"
        button.style.width = Math.max(options.minWidth, element.offsetWidth) + "px"
        button.title = element.title
        $element.addClass("ui-helper-hidden-accessible")


        var list = [], index = 0, els = [], model
        function getOptions(i, el) {
            if (el.tagName === "OPTION") {
                list.push({
                    isOption: true,
                    text: el.text,
                    index: index++,
                    selected: !el.disabled && el.selected,
                    disabled: el.disabled
                })
                els.push(el)
            } else if (el.tagName === "OPTGROUP") {
                list.push({
                    isOption: false,
                    text: el.label,
                    index: 0,
                    selected: false,
                    disabled: true
                })
                els.push(el)
                avalon.each(el.childNodes, getOptions)
            }
        }

        avalon.each(element.childNodes, getOptions)
        var menuHTML = '<div class="ui-multiselect-menu ui-widget ui-widget-content ui-corner-all"'
                + ' ms-visible="toggle" tabindex="-1">'
                + '<div class="ui-widget-header ui-corner-all ui-multiselect-header ui-helper-clearfix">'
                + '<ul class="ui-helper-reset">'
                + '<span ms-if="!multiple">' + options.caption + '</span>'
                + '<li ms-if="multiple"><a class="ui-multiselect-all"  href="return false" ms-click="checkAll"><span class="ui-icon ui-icon-check"></span><span>{{checkAllText}}</span></a></li>'
                + '<li ms-if="multiple"><a class="ui-multiselect-none" href="return false" ms-click="unCheckAll"><span class="ui-icon ui-icon-closethick"></span><span>{{unCheckAllText}}</span></a></li>'
                + '<li class="ui-multiselect-close"><a href="#" class="ui-multiselect-close" ms-click="closeMenu"><span class="ui-icon ui-icon-circle-close"></span></a></li>'
                + '</ul></div>'
                + '<ul class="ui-multiselect-checkboxes ui-helper-reset" ms-css-height="height" ms-each-el="list" >'
                + '<li ms-class="ui-multiselect-optgroup-label:!el.isOption" >'
                + '<a href="#" ms-if="!el.isOption" >{{el.text}}</a>'
                + '<label for="rubylouvre" ms-if="el.isOption" ms-hover="ui-state-hover" ms-class="ui-state-disabled:el.disabled" ms-click="changeState" class="ui-corner-all">'
                + '<input ms-visible="multiple" ms-disabled="el.disabled"    ms-checked="el.selected" type="checkbox"><span>{{el.text}}</span></label></li>'
                + '</ul></div>'
        var menu = avalon.parseHTML(menuHTML).firstChild
        menu.style.width = button.style.width
        var curCaption = options.caption
        var canClose = false

        avalon.bind(button, "mouseenter", function(e) {
            canClose = false
        })

        avalon.bind(menu, "mouseleave", function(e) {
            canClose = true
        })
        avalon.bind(document, "click", function(e) {
            if (canClose) {
                model.toggle = false
            }
        })
        model = avalon.define(id, function(vm) {
            avalon.mix(vm, options)
            vm.list = list
            vm.multiple = element.multiple
            function getCaption() {
                if (vm.multiple) {
                    var l = vm.list.filter(function(el) {
                        return el.isOption && el.selected && !el.disabled
                    }).length
                    return l ? l + " selected" : curCaption
                } else {
                    return  element[element.selectedIndex].text
                }
            }
            vm.caption = getCaption()
            vm.toggleMenu = function() {
                vm.toggle = !vm.toggle
            }
            vm.$watch("toggle", function(v) {
                if (v) {
                    var offset = avalon(button).offset()
                    menu.style.top = offset.top + button.offsetHeight + "px"
                    menu.style.left = offset.left + "px"
                    options.onOpen.call(element)
                } else {
                    options.onClose.call(element)
                }
            })
            vm.closeMenu = function(e) {
                e.preventDefault()
                vm.toggle = false
            }
            vm.checkAll = function(e, val) {
                e.preventDefault()
                val = !val
                vm.list.forEach(function(el) {
                    if (el.isOption && !el.disabled) {
                        el.selected = val
                    }
                })
                vm.caption = getCaption()
            }
            vm.unCheckAll = function(e) {
                vm.checkAll(e, true)
            }

            vm.changeState = function(e) {
                var obj = this.$vmodel.el
                if (!obj.disabled) {//重要技巧,通过e.target == this排除冒泡上来的事件
                    var index = obj.index
                    var option = els[index]
                    if (vm.multiple) {
                        var a = obj.selected
                        option.selected = obj.selected = !a
                    } else {
                        element.selectedIndex = vm.selectedIndex = index
                        option.selected = true
                        setTimeout(function() {
                            vm.toggle = false
                        }, 250)
                    }
                    options.onChange.call(element)
                    vm.caption = getCaption()
                }
            }
        })
        avalon.ready(function() {
            avalon.nextTick(function() {
                element.parentNode.insertBefore(button, element.nextSibling)
                var modes = [model].concat(vmodels)
                avalon.scan(button, modes)
                document.body.appendChild(menu)
                avalon.scan(menu, modes)
            })

        })

        return model
    }

    return avalon
})
//http://www.erichynds.com/examples/jquery-ui-multiselect-widget/demos/#single
