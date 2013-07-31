define(["avalon"], function(avalon) {
    var defaults = {
        active: 0,
        collapsible: false//当一个面板打开时，再点击它时会收起
    }
    avalon.ui.accordion = function(element, id, vmodels, opts) {
        var $element = avalon(element),
                model, el
        var fragment = document.createDocumentFragment()
        //处理配置
        var options = avalon.mix({}, defaults, opts, $element.data())
        $element.addClass(" ui-accordion ui-widget ui-helper-reset")
        var el, tabs = [],
                tabpanels = []

        while (el = element.firstChild) {
            fragment.appendChild(el)
            if (el.tagName === "H3") {
                el.setAttribute("ms-hover", "ui-state-hover")
                el.setAttribute("ms-click", "activate")
                avalon(el).addClass("ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all")
                var icon = document.createElement("span")
                icon.className = "ui-accordion-header-icon ui-icon";
                icon.setAttribute("ms-class-0", "ui-icon-triangle-1-s:active == " + tabs.length)
                icon.setAttribute("ms-class-1", "ui-icon-triangle-1-e:active != " + tabs.length)
                el.appendChild(icon)
                tabs.push(el)
            }
            if (el.tagName === "DIV") {
                el.setAttribute("ms-visible", "active == " + tabpanels.length)
                tabpanels.push(el)
                avalon(el).addClass(" ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom")
            }
        }
        var model = avalon.define(id, function(vm) {
            vm.active = options.active;
            vm.collapsible = options.collapsible
            vm.activate = function(e) {
                e.preventDefault()
                var index = tabs.indexOf(this)
                if (vm.collapsible) {
                    if (vm.active === index) {
                        vm.active = -1
                    } else {
                        vm.active = index
                    }
                } else {
                    vm.active = index
                }
            }
        })
        avalon.nextTick(function() {
            element.appendChild(fragment)
            avalon.scan(element, [model].concat(vmodels))
        })
    }
    return avalon
})
/*
 <div  ms-ui="accordion" >
 <h3>标题1</h3>
 <div>
 面板1
 </div>
 <h3>标题2</h3>
 <div>
 面板2
 </div>
 <h3>标题3</h3>
 <div>
 面板3
 </div>
 <h3>标题4</h3>
 <div>
 面板4
 </div>
 </div>
 */