define(["avalon"], function(avalon) {

    var useTransition = window.TransitionEvent || window.WebKitTransitionEvent

    var styleEl = document.getElementById("avalonStyle")
    //http://stackoverflow.com/questions/5103283/does-internet-explorer-support-css-transitions
    if (useTransition) {
        styleEl.innerHTML += ".ui-transition{-webkit-transition:all 0.5s ease;-ms-transition:all 0.5s ease;transition:all 0.5s ease;}"
        styleEl.innerHTML += ".ui-accordion-collapse {height:0px!important;padding:0px!important;}"
    }
    var widget = avalon.ui.accordion = function(element, data, vmodels) {
        var $element = avalon(element), options = data.accordionOptions, tabs = [],
                tabpanels = [],
                model, el
        var fragment = document.createDocumentFragment()

        $element.addClass(" ui-accordion ui-widget ui-helper-reset")
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
                avalon(el).addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom")
                if (useTransition) {
                    avalon(el).addClass("ui-transition")
                    el.setAttribute("ms-class-ui-accordion-collapse", "active != " + tabpanels.length)
                } else {
                    el.setAttribute("ms-visible", "active == " + tabpanels.length)
                }
                tabpanels.push(el)
            }
        }
        var model = avalon.define(data.accordionId, function(vm) {
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
    widget.defaults = {
        active: 0,
        collapsible: false//当一个面板打开时，再点击它时会收起
    }
    return avalon
})
/*
 <div  ms-widget="accordion" >
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