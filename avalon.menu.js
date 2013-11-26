/* 
 * http://apycom.com/menus/13-lawn-green.html
 * and open the template in the editor.
 */


define(["avalon", "mmAnimate"], function(avalon) {
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
    var DIVClass = {
        0: "",
        1: "",
        2: "two",
        3: "three",
        4: "four",
        5: "five"
    }
    var LIClass = {
        0: "one",
        1: "two",
        2: "three",
        3: "four",
        4: "five"
    }
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

                el.skipArray = ["lastObj", "columns"]

                el.backgroundPosition = "backgroundPosition"
                el.color = "rgb(231,107,60)"

                el.lastObj = {}
                el.columns = ""
                if (typeof el.content !== "string") {
                    el.content = "&nbsp;"
                }
                if (avalon.type(el.submenu) !== "array") {
                    el.submenu = []
                } else {
                    if (avalon.type(el.submenu[0]) === "array") {
                        var columns = el.submenu, column, j = 0
                        while (column = columns.shift()) {
                            if (avalon.type(column) == "array" && column.length) {
                                el[ "submenu" + (j ? j : "")] = column
                                fix(column)
                                j++
                            }
                        }
                        el.columns = j
                    } else {
                        fix(el.submenu)
                    }

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
        var submenuHTML = '<ul CLASS ><li ms-repeat="SUBMENU" ms-mouseenter="showSubMenu(el)" ms-mouseleave="hideSubMenu(el)">' +
                '<a ms-href="el.href"  ms-class-parent="el.submenu.length" ><span>{{ el.content }}</span></a>' +
                '<span class="spanbox" ms-if="el.submenu.length" ms-css-color="color"  ms-css="backgroundPosition: backgroundPosition" >' +
                '<div ms-include="submenuHTML" data-include-loaded="processTemplate" ></div></span></li></ul>'

        script.innerHTML = submenuHTML
        element.parentNode.appendChild(script)
        var children

        var mainMenuHTML = '<ul class="menu"><li ms-repeat-elem="mainmenu" ms-mouseenter="showMain(elem)" ms-mouseleave="hideMain(elem)" ms-class-last="$last" ms-class-current="currentIndex == $index">' +
                '<a ms-href="elem.href" class="mainlink" ms-class-parent="elem.submenu.length"   ><span>{{ elem.content }}</span></a>' +
                '<span  class="spanbox" ms-if="elem.submenu.length"  >' +
                '<div ms-include="submenuHTML" data-include-loaded="processTemplate"></div>' +
                '</span></li>' +
                '<li ms-css-left="backLeft"  ms-class="{{backClass}}" ms-css-width="backWidth"  style="overflow: hidden;" class="back"><div class="left"></div></li></ul>'// " ms-css-overflow="overflow"

        var backTimer
        model = avalon.define(data.menuId, function(vm) {
            avalon.mix(vm, options)
            vm.processTemplate = function(text, a, b) {
                if (b.columns > 1) {
                    var style = this.parentNode.style
                    style.width = 200 * b.columns + "px"
                    style.paddingTop = "14px"
                    avalon(this).addClass("columns " + DIVClass[b.columns])
                    var ret = ""
                    for (var i = 0; i < b.columns; i++) {
                        var index = i === 0 ? "" : i
                        ret += text.replace("CLASS", "class=" + LIClass[i]).replace("SUBMENU", "submenu" + index)
                    }
                    return ret
                } else {
                    return   text.replace("CLASS", "").replace("SUBMENU", "submenu")
                }
            }
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
                //处理主菜单的阴影移动
                var back = children[children.length - 1]
                avalon(back).stop(true, true).fx({
                    width: this.offsetWidth,
                    left: this.offsetLeft
                }, 500, "linear")

                if (box) {
                    retarder(div, 400, function(i) {
                        box.style.display = "block"
                        box.style.visibility = "visible"
                        if (!box.hei) {
                            box.hei = $(box).height() + 50
                            box.wid = div.clientWidth
                            div.style.height = box.clientHeight + "px"
                        }


                        box.style.height = 0 + "px"
                        box.style.width = box.wid + "px"
                        div.style.top = -(box.hei) + "px"
                        box.style.overflow = "hidden"
                        avalon(box).stop(true, true).fx({
                            height: box.hei
                        }, 300)
                        avalon(div).stop(false, true).fx({top: 0}, {duration: 300, easing: 'easeOutCubic', complete: function() {
                                div.style.top = "0px"
                                box.style.height = box.hei - 50 + "px"
                                box.style.overflow = "hidden"
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
                //处理主菜单的阴影移动
                var back = children[children.length - 1]
                var current = children[vm.currentIndex]
                avalon(back).stop(true, true).fx({
                    width: current.offsetWidth,
                    left: current.offsetLeft
                }, 500, "easeIn")

                if (box) {
                    if (!box.hei) {
                        box.hei = box.clientHeight + 50;
                        box.wid = box.clientWidth
                    }
                    var animate = {from: {top: 0}, to: {top: -(box.hei)}};
                    if (!IE678) {
                        animate.from.opacity = 1;
                        animate.to.opacity = 0
                    }
                    $('span.spanbox span.spanbox', this).css('visibility', 'hidden');
                    retarder(div, 150, function() {
                        box.style.height = box.hei - 50 + "px"
                        box.style.width = box.wid + "px"
                        box.style.overflow = "hidden"
                        avalon(box).stop(true, true).fx({
                            height: 0
                        }, 200)
                        avalon(div).css("opacity", 1).stop(false, true).fx(animate.to, {duration: 200, complete: function() {
                                if (!IE678) {
                                    div.style.opacity = 1
                                }
                                box.style.display = "none"
                            }
                        })
                    })
                }
            }




            vm.showSubMenu = function(scope) {
                if (scope.submenu.length) {
                    scope.color = 'rgb(255,255,255)'
                    scope.backgroundPosition = '-960px bottom'
                }
                var array = getSpanBox(this)
                var box = array[0]
                var div = array[1]
                if (box) {
                    retarder(div, 180, function() {
                        try {
                            box.parentNode.parentNode.parentNode.parentNode.style.overflow = "visible"
                        } catch (e) {
                        }
                        box.style.display = "block"
                        box.style.visibility = "visible"
                        if (!box.hei) {
                            box.hei = $(box).height()
                            box.wid = $(box).width() + 50;
                            div.style.height = box.hei + "px"
                        }
                        box.style.overflow = "hidden"
                        box.style.height = box.hei + "px"
                        box.style.width = box.wid + "px"
                        avalon(div).css("left", -(box.wid)).stop(true, true).fx({left: 0}, {duration: 200, complete: function() {
                                div.style.left = "-3px"
                                box.style.width = box.wid - 50 + "px"
                                box.style.overflow = "hidden"
                            }
                        })
                    })
                }
            }
            vm.hideSubMenu = function(scope) {
                if (scope.submenu.length) {
                    scope.color = 'rgb(231,107,60)'
                    scope.backgroundPosition = '-576px bottom'
                }
                var array = getSpanBox(this)
                var box = array[0]
                var div = array[1]
                if (box) {
                    if (!box.hei) {
                        box.hei = box.clientHeight
                        box.wid = box.clientWidth + 50
                    }
                    var animate = {from: {left: 0}, to: {left: -(box.wid)}};
                    if (!IE678) {
                        animate.from.opacity = 1;
                        animate.to.opacity = 0
                    }
                    retarder(div, 150, function() {
                        box.style.overflow = "hidden"
                        box.style.height = box.hei + "px"
                        box.style.width = box.wid - 50 + "px"
                        avalon(div).css("left", 0).stop(true, true).fx(animate.to, {duration: 200, complete: function() {
                                if (!IE678) {
                                    div.style.opacity = 1
                                }
                                box.style.display = "none"
                            }})
                    })
                }

            }

            vm.backClass = ""
            vm.skipArray = ["mainmenu"]
            vm.mainmenu = fix(options.data || [])
            //  console.log(vm.mainmenu )
        })
        avalon.nextTick(function() {
            element.innerHTML = mainMenuHTML

            avalon.scan(element, [model].concat(vmodels))
            children = element.firstChild.children


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

/*
 var duration = 400
 var startTime = new Date - 0
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
 */