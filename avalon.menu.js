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
    var IE678 = !-[1, ]

    //   console.log
    var widget = avalon.ui.menu = function(element, data, vmodels) {
        var $element = avalon(element), options = data.menuOptions, model
        $element.addClass("active")
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

        var script = document.createElement("noscript")

        script.id = "submenuHTML"

        function getSpanBox(elem) {
            var box, div
            for (var i = 0, node; node = elem.childNodes[i++]; ) {
                if (node.nodeType == 1 && /spanbox/.test(node.className)) {
                    box = node
                    break;
                }
            }
            if (box) {
                for (i = 0; node = box.childNodes[i++]; ) {
                    if (node.nodeType == 1) {
                        div = node
                        break
                    }
                }
            }
            return [box, div]
        }
        var submenuHTML = '<ul ><li ms-repeat="submenu">' +
                '<a ms-href="el.href"  ms-class-parent="el.submenu.length" ><span>{{ el.content }}</span></a>' +
                '<span class="spanbox" ms-css-visibility=visibility >' +
                '<div ms-if="el.submenu.length" ms-include="submenuHTML"  ></div></span></li></ul>'
        script.innerHTML = submenuHTML
        element.parentNode.appendChild(script)
        var mainMenuHTML = '<ul class="menu"><li ms-repeat-elem="mainmenu" ms-mouseenter="showMain(elem)" ms-mouseleave="hideMain(elem)" ms-class-last="$last" ms-class-current="currentIndex == $index">' +
                '<a ms-href="elem.href" class="mainlink" ms-class-parent="elem.submenu.length"><span>{{ elem.content }}</span></a>' +
                '<span  class="spanbox" ms-if="elem.submenu.length" >' +
                '<div ms-include="submenuHTML"   ></div>' +
                '</span></li>' +
                '<li ms-css-left="backLeft" ms-class="{{backClass}}" ms-css-width="backWidth"  style="overflow: hidden;" class="back"><div class="left"></div></li></ul>'// " ms-css-overflow="overflow"
        var backTimer
        model = avalon.define(data.menuId, function(vm) {
            avalon.mix(vm, options)

            vm.showMain = function(scope) {
                var array = getSpanBox(this)
                var box = array[0]
                var div = array[1]
                if (backTimer) {
                    clearTimeout(backTimer)
                }
                backTimer = setTimeout(function() {
                    model.backClass = scope.submenu.length ? "current-parent-back" : "current-back"
                }, 300)

                if (box) {
                    retarder(div, 400, function(i) {
                        box.style.display = "block"
                        box.style.visibility = "visible"
                        if (!box.hei) {
                            box.hei = box.clientHeight + 50
                            box.wid = box.clientWidth
                            div.style.height = box.clientHeight + "px"
                        }
                        box.style.height = box.hei + "px"
                        box.style.width = box.wid + "px"
                        box.style.overflow = "hidden"
                        div.style.top = -(box.hei) + "px"
                        $(div).stop(true, true).animate({top: 0}, {duration: 300, complete: function() {
                                div.style.top = "0px"
                                box.style.height = box.hei - 50 + "px"
                            }})
                    })
                }
            }
            vm.hideMain = function(scope) {
                var array = getSpanBox(this)
                var box = array[0]
                var div = array[1]
                if (backTimer)
                    clearTimeout(backTimer)
                model.backClass = ""
                if (box && box.hei) {
                    var animate = {from: {top: 0}, to: {top: -(box.hei)}};
                    if (!IE678) {
                        animate.from.opacity = 1;
                        animate.to.opacity = 0
                    }
                    for (var i = 0, obj; obj = scope.submenu[i++]; ) {
                        obj.visibility = "hidden"
                    }
                    retarder(div, 150, function(i) {
                        box.style.height = box.hei - 50 + "px"
                        box.style.width = box.wid - 50 + "px"
                        box.style.overflow = "hidden"
                        $(div).css(animate.from).stop(true, true).animate(animate.to, {duration: 200, complete: function() {
                                if (!IE678) {
                                    div.style.opacity = 1
                                }
                                box.style.display = "none"
                            }
                        })
                    })
                }
            }


            /*  vm.showMenu = function(scope, effect, isMain) {
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
             //   console.log(isMain)
             if (scope.submenu.length) {
             console.log("多次进入showMenu")
             if (scope.visibility === "visible")
             return
             scope.visibility = "visible";
             scope.display = "block"
             
             this.style.width = avalon(this).width() + "px"//必须，防御LI被撑开
             this.style.height = avalon(this).height() + "px"
             this.style.left = avalon(this).height() + "px"
             
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
             }*/
            vm.backClass = ""
            vm.mainmenu = fix(options.data || [])
        })
        avalon.nextTick(function() {
            element.innerHTML = mainMenuHTML
            var mainlinks = element.getElementsByTagName("a")
            for (var i = 0, el; el = mainlinks[i++]; ) {
                if (/mainlink/.test(el.className)) {
                    el.style.background = "none"
                    var spans = el.getElementsByTagName("span")
//                    if (spans.length) {
//                        var span = spans[0]
//                        if (/parent/.test(el.className)) {
//                            span.style.backgroundPosition = "right -91px"
//                        } else {
//                            span.style.backgroundPosition = "right 0"
//                        }
//                    }
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