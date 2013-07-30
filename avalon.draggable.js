define(["avalon"], function(avalon) {
    var defaults = {
        ghosting: false, //是否影子拖动，动态生成一个元素，拖动此元素，当拖动结束时，让原元素到达此元素的位置上,
        delay: 0,
        axis: "xy",
        dragstart: function() {
        },
        drag: function() {
        },
        dragend: function() {
        }
    }
    var body
    var ua = navigator.userAgent;
    var isAndroid = /Android/i.test(ua);
    var isBlackBerry = /BlackBerry/i.test(ua)
    var isWindowPhone = /IEMobile/i.test(ua)
    var isIOS = /iPhone|iPad|iPod/i.test(ua)
    var isMobile = isAndroid || isBlackBerry || isWindowPhone || isIOS
    if (!isMobile) {
        var dragstart = "mousedown"
        var drag = "mousemove"
        var dragend = "mouseup"
    } else {
        dragstart = "touchstart"
        drag = "touchmove"
        dragend = "touchend"
    }
    function getPostion(e, pos) {
        var page = "page" + pos
        return isMobile ? e.changedTouches[0][page] : e[page]
    }

    function setPosition(e, element, data, pos, end) {
        var page = getPostion(e, pos)
        if (data.containment) {
            var min = pos === "X" ? data.containment[0] : data.containment[1]
            var max = pos === "X" ? data.containment[2] : data.containment[3]
            var check = page - (pos === "X" ? data.clickX : data.clickY)
            if (check < min) {
                page += Math.abs(min - check)
            } else if (check > max) {
                page -= Math.abs(max - check)
            }
        }
        var number = data["start" + pos] + page - data["page" + pos] + (end ? data["end" + pos] : 0)
        var prop = pos === "X" ? "left" : "top"
        element.style[ prop ] = number + "px"

    }


    var clearSelection = window.getSelection ?
            function() {
                window.getSelection().removeAllRanges();
            } : function() {
        document.selection.clear();
    }

    var styleEl = document.createElement("style")
    var cssText = "*{ -webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;}"
    function fixUserSelect() {
        body.appendChild(styleEl)
        //如果不插入DOM树，styleEl.styleSheet为null
        if (typeof styleEl.styleSheet === "object") {
            styleEl.styleSheet.cssText = cssText
        } else {
            styleEl.appendChild(document.createTextNode(cssText))
        }
    }
    function restoreUserSelect() {
        if (!styleEl.styleSheet) {
            styleEl.innerText = ""
            styleEl.removeChild(styleEl.firstChild)
        }
        body.removeChild(styleEl)
    }
    if (window.VBArray && !("msUserSelect" in document.documentElement.style)) {
        var _ieSelectBack;//fix IE6789
        function returnFalse() {
            return false;
        }
        function fixUserSelect() {
            _ieSelectBack = body.onselectstart;
            body.onselectstart = returnFalse;
        }
        function restoreUserSelect() {
            body.onselectstart = _ieSelectBack;
        }
    }


    avalon(document).bind(drag, function(e) {
        var data = draggable.dragData
        if (!data || !data.started)
            return
        fixUserSelect()
        //fix touchmove bug;  
        //IE 在 img 上拖动时默认不能拖动（不触发 mousemove，mouseup 事件，mouseup 后接着触发 mousemove ...）
        //防止 html5 draggable 元素的拖放默认行为 (选中文字拖放)
        e.preventDefault();
        clearSelection();
        var element = data.clone || data.element
        if (data.dragX) {
            setPosition(e, element, data, "X")
        }
        if (data.dragY) {
            setPosition(e, element, data, "Y")
        }
        data.drag.call(data.element, e, data)
    })


    avalon(document).bind(dragend, function(e) {
        var data = draggable.dragData
        if (!data || !data.started)
            return
        restoreUserSelect()
        clearSelection();
        var element = data.element
        if (data.dragX) {
            setPosition(e, element, data, "X", true)
        }
        if (data.dragY) {
            setPosition(e, element, data, "Y", true)
        }
        if (data.clone) {
            data.clone.parentNode.removeChild(data.clone)
        }
        data.dragend.call(data.element, e, data)
        delete draggable.dragData
    })

    "scrollLeft_pageXOffset,scrollTop_pageYOffset".replace(/(\w+)_(\w+)/g, function(_, method, prop) {
        avalon.fn[method] = function(val) {
            var node = this[0] || {}, win = getWindow(node), top = method === "scrollTop";
            if (!arguments.length) {
                return win ? (prop in win) ? win[prop] : document.documentElement[method] : node[method];
            } else {
                if (win) {
                    win.scrollTo(!top ? val : avalon(win).scrollLeft(), top ? val : avalon(win).scrollTop());
                } else {
                    node[method] = val;
                }
            }

        };
    });

    function getWindow(node) {
        return node.window && node.document ? node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
    }
    function setContainment(o, data) {
        if (!o.containment) {
            data.containment = null;
            return;
        }

        if (o.containment === "window") {
            var $window = avalon(window)
            data.containment = [
                $window.scrollLeft(),
                $window.scrollTop(),
                $window.scrollLeft() + $window.width() - data.marginLeft,
                $window.scrollTop() + $window.height() - data.marginTop
            ];
            return;
        }

        if (o.containment === "document") {
            data.containment = [
                0,
                0,
                avalon(document).width() - data.marginLeft,
                avalon(document).height() - data.marginTop
            ];
            return;
        }

        if (o.containment.constructor === Array) {
            data.containment = o.containment;
            return;
        }

        if (o.containment === "parent" || o.containment.charAt(0) === "#") {
            var elem
            if (o.containment === "parent") {
                elem = data.element.parentNode;
            } else {
                elem = document.getElementById(o.containment.slice(1))
            }
            if (elem) {
                var $offset = avalon(elem).offset()
                data.containment = [
                    $offset.left,
                    $offset.top,
                    $offset.left + elem.offsetWidth - data.marginLeft,
                    $offset.top + +elem.offsetHeight - data.marginTop
                ]
            }
        }
    }

    var draggable = avalon.bindingHandlers.draggable = function(data, vmodels) {
        var fn = data.value.trim(), dragCallback
        for (var i = 0, vm; vm = vmodels[i++]; ) {
            if (vm.hasOwnProperty(fn)) {
                if (typeof vm[fn] === "function") {
                    dragCallback = vm[fn]
                    break;
                }
            }
        }
        var optsName = data.args.join("-"), opts
        for (var i = 0, vm; vm = vmodels[i++]; ) {
            if (vm.hasOwnProperty(fn)) {
                if (typeof vm[optsName] === "object") {
                    opts = vm[optsName]
                    break;
                }
                break
            }
        }

        opts = opts || {}
        var element = data.element
        var $element = avalon(element)
        var options = avalon.mix({}, defaults, opts, $element.data());
        if (dragCallback) {
            options.drag = dragCallback
        }

        if (options.axis !== "" && !/^(x|y|xy)$/.test(options.axis)) {
            options.axis = "xy"
        }
        body = document.body //因为到这里时，肯定已经domReady
        $element.bind(dragstart, function(e) {


            var data = {
                element: element,
                $element: $element,
                pageX: getPostion(e, "X"),
                pageY: getPostion(e, "Y"),
                started: true,
                marginLeft: parseFloat($element.css("marginLeft")),
                marginTop: parseFloat($element.css("marginTop")),
                dragstart: options.dragstart,
                drag: options.drag,
                dragend: options.dragend
            }
            options.axis.replace(/./g, function(a) {
                data["drag" + a.toUpperCase() ] = true
            })
            if (!data.dragX && !data.dragY) {
                data.started = false
            }

            var position = $element.css("position")
            //如果原元素没有被定位
            if (!/^(?:r|a|f)/.test(position)) {
                element.style.position = "relative";
                element.style.top = "0px"
                element.style.left = "0px"
            }

            if (options.delay && isFinite(options.delay)) {
                data.started = false;
                setTimeout(function() {
                    data.started = true
                }, options.delay)
            }
            var startOffset = $element.offset()
            if (options.ghosting) {
                var clone = element.cloneNode(true)
                clone.style.backgroundColor = "yellow"
                data.clone = clone
                if (position !== "fixed") {
                    clone.style.position = "absolute"
                    clone.style.top = startOffset.top - data.marginTop + "px"
                    clone.style.left = startOffset.left - data.marginLeft + "px"
                }
                document.body.appendChild(clone)
            }

            var target = avalon(data.clone || data.element)

            data.startX = parseFloat(target.css("left"))
            data.startY = parseFloat(target.css("top"))
            //如果是影子拖动，代理元素是绝对定位时，它与原元素的top, left是不一致的，因此当结束拖放时，不能直接将改变量赋给原元素
            data.endX = parseFloat($element.css("left")) - data.startX
            data.endY = parseFloat($element.css("top")) - data.startY
            data.clickX = data.pageX - startOffset.left //鼠标点击的位置与目标元素左上角的距离
            data.clickY = data.pageY - startOffset.top //鼠标点击的位置与目标元素左上角的距离
            setContainment(options, data)
            draggable.dragData = data
            data.dragstart.call(data.element, e, data)
        })

    }

    return avalon
})
