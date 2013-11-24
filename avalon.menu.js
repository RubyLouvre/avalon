/* 
 * http://apycom.com/menus/13-lawn-green.html
 * and open the template in the editor.
 */


define(["avalon"], function(avalon) {
//http://xdsoft.net/jqplugins/datetimepicker/
    var requestAnimFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60)
            }
    var _timer_ = "menu-" + avalon.subscribers

    var retarder = function(node, delay, method) {
        if (node[_timer_]) {
            clearTimeout(node[_timer_])
        }
        node[_timer_] = setTimeout(function() {
            method(node);
        }, delay);
    }

    //   console.log
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
        var submenuHTML = '<ul ><li ms-repeat="submenu"  ms-mouseenter="showMenu(el, \'slideRight\', false)"   ms-mouseleave="hideMenu(el)">' +
                '<a ms-href="el.href"  ms-class-parent="el.submenu.length" ><span>{{ el.content }}</span></a>' +
                '<span class="spanbox" ms-if="el.submenu.length"   ms-css-width="width" ms-css-height="height" ms-css-overflow="overflow" ms-css-display="display" ms-css-visibility="visibility" >' +
                '<div ms-include="submenuHTML" ms-css-overflow="overflow" ms-css-height="height"  ms-css-height="width" ms-css-display="display" ></div></span></li></ul>'
        var script = document.createElement("script")
        script.type = "avalon"
        script.text = submenuHTML
        script.id = "submenuHTML"
        element.parentNode.appendChild(script)
        //  avalon.includeContents
        var mainMenuHTML = '<ul class="menu"><li ms-repeat-elem="mainmenu" ms-mouseenter="showMenu(elem,\'slideDown\', true)"   ms-mouseleave="hideMenu(elem)" ms-class-last="$last" ms-class-active="activeIndex == $index" ms-class-current="currentIndex == $index">' +
                '<a ms-href="elem.href" class="mainlink" ms-class-parent="elem.submenu.length"><span>{{ elem.content }}</span></a>' +
                '<span  class="spanbox" ms-if="elem.submenu.length"  ms-css-width="width" ms-css-height="height" ms-css-overflow="overflow" ms-css-display="display" ms-css-visibility="visibility" >' +
                '<div ms-include="submenuHTML"  ms-css-height="height" style="z-index:-1" ms-css-display="display" ></div>' +
                '</span></li>' +
                '<li ms-css-left="backLeft" ms-css-width="backWidth"  style="overflow: hidden;" class="back"><div class="left"></div></li></ul>'// " ms-css-overflow="overflow"
        model = avalon.define(data.menuId, function(vm) {
            avalon.mix(vm, options)
            vm.hideMenu = function(scope) {

                avalon(element).removeClass("active")
                setTimeout(function() {
                    scope.visibility = "hidden";
                    scope.display = "none"
                    scope.height = 0
                    scope.width = 0
                })

            }

            vm.showMenu = function(scope, effect, isMain) {
                avalon(element).addClass("active")
                if (isMain) {
                    var back = $(".back")
                    if (scope.submenu.length) {
                        back.addClass("current-parent-back").removeClass("current-back")
                    } else {
                        back.addClass("current-back").removeClass("current-parent-back")
                    }
                    back.animate({
                        left: parseFloat(this.offsetLeft),
                        width: parseFloat(this.offsetWidth)
                    }, 600)
                }
                console.log(isMain)
                if (scope.submenu.length) {
                    console.log("多次进入showMenu")
                    if (scope.visibility === "visible")
                        return
                    scope.visibility = "visible";
                    scope.display = "block"

                    this.style.width = avalon(this).width() + "px"//必须，防御LI被撑开
                    this.style.height = avalon(this).height() + "px"
                    this.style.left = avalon(this).height() + "px"

                    // model.backLeft = this.style.left
                    //  model.backWidth = this.style.width
                    var spanbox
                    for (var i = 0, node; node = this.childNodes[i++]; ) {
                        if (node.nodeType == 1 && /spanbox/.test(node.className)) {
                            spanbox = node
                            break;
                        }
                    }
                    if (!spanbox._width) {
                        var ul = this.getElementsByTagName("ul")[0]
                        if (!ul)
                            return
                        console.log(ul + "!")
                        spanbox._width = avalon(ul).width()
                        spanbox._height = avalon(ul).height()
                        spanbox._top = parseFloat(avalon(spanbox).css("top"))
                        spanbox._left = parseFloat(avalon(spanbox).css("left"))
                    }
                    var div = spanbox.firstElementChild || spanbox.children[0]
                    scope.overflow = "hidden"
                    scope.height = spanbox._height //+ marginTop
                    scope.width = spanbox._width
                    var duration = 400
                    var startTime = new Date - 0
                    var WH = effect === "slideRight" ? "width" : "height"
                    var LT = effect === "slideRight" ? "left" : "top"
                    console.log(LT)
                    var change = -1 * spanbox["_" + WH]
                    div.style[LT] = change + 'px'
                    function animate() {
                        var ellapseTime = new Date - startTime;
                        if (ellapseTime >= duration) {
                            div.style[LT] = "0px"
                            scope.overflow = "visible";
                            return;
                        }
                        div.style[LT] = change * (1 - (ellapseTime / duration)) + "px"
                        requestAnimationFrame(animate)
                    }
                    requestAnimationFrame(animate)

                }
            }
            vm.mainmenu = fix(options.data || [])
        })
        avalon.nextTick(function() {

            element.innerHTML = mainMenuHTML
            var mainlinks = element.getElementsByTagName("a")
            for (var i = 0, el; el = mainlinks[i++]; ) {
                if (/mainlink/.test(el.className)) {
                    el.style.background = "none"
                    var spans = el.getElementsByTagName("span")
                    if (spans.length) {
                        var span = spans[0]
                        if (/parent/.test(el.className)) {
                            span.style.backgroundPosition = "right -91px"
                        } else {
                            span.style.backgroundPosition = "right 0"
                        }
                    }
                }
            }

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