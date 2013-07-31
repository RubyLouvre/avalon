define(["avalon"], function(avalon) {
    var defaults = {
        items: 8
    }

    avalon.ui.autocomplete = function(element, id, vmodels, opts) {

        var $element = avalon(element),
                refreshList,
                tempValue = "",
                model
        //处理配置
        var options = avalon.mix({}, defaults, opts, $element.data())
        var source = options.source || []
        var sourceList = document.createElement("div")
        sourceList.innerHTML = '<ul  class="ui-autocomplete ui-front ui-menu ui-widget ui-widget-content ui-corner-all" ms-each-presentation="matcher" ms-visible="show" >' +
                '<li  class="ui-menu-item" ><a  class="ui-corner-all" tabindex="-1" ms-mouseover="get" ms-hover="ui-state-focus" ms-class="ui-state-focus:matcher[selectedIndex] === presentation "  >{{presentation}}</a></li>' +
                '</ul>'
        for (var i = 0, node; node = element.attributes[i++]; ) {
            var name = node.name
            if (name.indexOf("ms-ui") === 0) {
                element.removeAttribute(name)//防止死循环
                break
            }
        }
 
        sourceList = sourceList.firstChild
        $element.bind("blur", function() {
            setTimeout(function() {
                refreshList = model.show = false //隐藏datalist
            }, 250)
        })
        avalon.bind(sourceList, "click", function() {
            model.value = model.overvalue
        })
        $element.bind("keyup", function(e) {
            if (/\w/.test(String.fromCharCode(e.which))) { //如果是字母数字键
                refreshList = true //这是方便在datalist显示时,动态刷新datalist
                model.value = element.value //触发$watch value回调
            } else {
                refreshList = false
                switch (e.which) {
                    case 8:
                        refreshList = true//回退键可以引发列表刷新
                        break
                    case 13:
                        tempValue = model.value
                        refreshList = model.show = false
                        break
                    case 38:
                        // up arrow
                        --model.selectedIndex
                        if (model.selectedIndex === -2) {
                            model.selectedIndex = model.matcher.length - 1
                        }
                        var value = model.matcher[model.selectedIndex]
                        model.value = value === void 0 ? tempValue : value
                        break

                    case 40:
                        // down arrow
                        ++model.selectedIndex
                        if (model.selectedIndex === model.matcher.length) {
                            model.selectedIndex = -1
                        }
                        var value = model.matcher[model.selectedIndex]
                        model.value = value === void 0 ? tempValue : value
                        break
                }
            }

        })

        model = avalon.define(id, function(vm) {
            vm.show = false
            vm.selectedIndex = -1
            vm.value = element.value
            vm.matcher = []
            vm.overvalue = ""
            vm.get = function() {
                vm.overvalue = this.$vmodel.presentation
            }
            vm.$watch("value", function(value) {
                if (refreshList !== false) { //flagKeyup是控制datalist的刷新
                    model.show = true
                    tempValue = value
                    var lower = []
                    var matcher = source.filter(function(el) {
                        if (el.indexOf(value) === 0) {
                            return el //最精确
                        }
                        if (el.toLowerCase().indexOf(value.toLowerCase()) === 0) {
                            lower.push(el) //不区分大小写
                        }
                    })
                    lower = matcher.concat(lower)
                    var query = value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
                    var strongRegExp = new RegExp('(' + query + ')', 'ig')
                    if (lower.length) {
                        vm.matcher = lower.slice(0, options.items)
                    } else { //模糊匹配,只要它中间有这些字母就行
                        vm.matcher = source.filter(function(el) {
                            return strongRegExp.test(el)
                        })
                    }
                }
            })
        })
        avalon.ready(function() {
            //  console.log(model)
            element.setAttribute("ms-duplex", "value")
            document.body.appendChild(sourceList)
            adjustPosition()
            var models = [model].concat(vmodels)
            avalon.scan(element, models)
            avalon.scan(sourceList, models)
        })

        function adjustPosition() {
            var offset = $element.offset()
            sourceList.style.width = element.clientWidth + "px"
            sourceList.style.left = offset.left + "px"
            sourceList.style.top = offset.top + element.offsetHeight + "px"
            sourceList.style.zIndex = 9999
            if (avalon(document).height() - 200 > offset.top) {
                var pageY = sourceList.offsetHeight + parseFloat(sourceList.style.top)
                window.scrollTo(pageY + 50, 0)
            }
        }
        $element.bind("focus", adjustPosition)

    }
    return avalon
})