/* 
 * http://apycom.com/menus/13-lawn-green.html
 * and open the template in the editor.
 */


define(["avalon.position"], function(avalon) {
//http://xdsoft.net/jqplugins/datetimepicker/
    var requestAnimFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60)
            }
    var widget = avalon.ui.menu = function(element, data, vmodels) {
        var $element = avalon(element), options = data.menuOptions, model

        function fix(array) {
            for (var i = 0, el; el = array[i]; i++) {
                if (typeof el === "string") {
                    array[i] = {
                        content: el
                    }
                    el = array[i]
                }
                if (typeof el.href !== "string") {
                    el.href = "#"
                }
                el.width = 0
                el.height = 0
                el.skipArray = ["lastObj"]
                el.visibility = "hidden"
                el.overflow = "visible"
                el.display = "block"
                el.lastObj = {}
                if (typeof el.content !== "string") {
                    el.content = "&nbsp;"
                }
                if (avalon.type(el.submenu) !== "array") {
                    el.submenu = []
                } else {
                    fix(el.submenu)

                }
            }
            return array
        }
        var submenuHTML = '<ul ><li ms-repeat="submenu"   >' +
                '<a ms-href="el.href"  ms-class-parent="el.submenu.length" ><span>{{ el.content }}</span></a>' +
                '<span class="spanbox" ms-if="el.submenu.length" style="">' +
                '<div ms-include="submenuHTML"></div></span></li></ul>'
        var script = document.createElement("script")
        script.type = "avalon"
        script.text = submenuHTML
        script.id = "submenuHTML"
        element.parentNode.appendChild(script)
        //  avalon.includeContents
        var mainMenuHTML = '<ul class="menu"><li ms-repeat-elem="mainmenu"    ms-mouseleave="hideMenu(elem)" ms-class-last="$last" ms-class-active="activeIndex == $index" ms-class-current="currentIndex == $index">' +
                '<a ms-href="elem.href" ms-mouseenter="showMenu(elem, $index)"  ms-class-parent="elem.submenu.length"><span>{{ elem.content }}</span></a>' +
                '<span  class="spanbox" ms-if="elem.submenu.length"  ms-css-width="width" ms-css-height="height" ms-css-overflow="overflow" ms-css-display="display" ms-css-visibility="visibility" >' +
                '<div  ms-if="elem.submenu.length" ms-include="submenuHTML" ms-css-overflow="overflow" ms-css-height="height"  ms-css-display="display" ></div>' +
                '</span></li>' +
                '<li ms-css-left="backLeft" ms-css-width="backWidth" style="overflow: hidden;" class="back"><div class="left"></div></li></ul>'// " ms-css-overflow="overflow"
        model = avalon.define(data.menuId, function(vm) {
            avalon.mix(vm, options)
            vm.hideMenu = function(scope) {
                setTimeout(function() {
                    scope.visibility = "hidden";
                    scope.display = "none"
                })

            }

            vm.showMenu = function(scope) {
                if (scope.submenu.length) {
                    console.log("多次进入showMenu")
                    if (scope.visibility === "visible")
                        return
                    scope.visibility = "visible";
                    scope.display = "block"
                    var parent = this.parentNode;
                    parent.style.width = avalon(parent).width() + "px"//必须，防御LI被撑宽
                    var node = this, spanbox
                    do {
                        if (node.nodeType == 1 && /spanbox/.test(node.className)) {
                            spanbox = node
                            break;
                        }
                    } while ((node = node.nextSibling))
                    if (!spanbox._width) {
                        var ul = parent.getElementsByTagName("ul")[0]
                        spanbox._width = avalon(ul).width()
                        spanbox._height = avalon(ul).height()
                        spanbox._top = parseFloat(avalon(spanbox).css("top"))
                        spanbox._left = parseFloat(avalon(spanbox).css("left"))
                    }
                    scope.height = spanbox._height
                    scope.width = spanbox._width
                    scope.overflow = "hidden"
                    var duration = 500
                    var startTime = new Date - 0
                    var change = spanbox._height 
                    function animate() {
                        var ellapseTime = new Date - startTime;
                        if (ellapseTime >= duration) {
                            scope.height = spanbox._height
                            scope.overflow = "visible";
                            return;
                        }
                        scope.height = change * (ellapseTime / duration)
                        requestAnimationFrame(animate)
                    }
                    requestAnimationFrame(animate)

                }
            }
            vm.mainmenu = fix(options.data || [])
        })
        avalon.nextTick(function() {

            element.innerHTML = mainMenuHTML
            avalon.scan(element, [model].concat(vmodels))

        })
        return model
    }


    widget.defaults = {
        backLeft: 0,
        backWidth: 136,
        currentIndex: 0,
        activeIndex: 0
    }
    return avalon
})