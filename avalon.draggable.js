define(["avalon"], function(avalon) {
    var defaults = {
        ghosting: false, //是否影子拖动，动态生成一个元素，拖动此元素，当拖动结束时，让原元素到达此元素的位置上,
        delay: 0,
        axis: "xy",
        started: true,
        start: avalon.noop,
        beforeStart: avalon.noop,
        drag: avalon.noop,
        beforeStop: avalon.noop,
        stop: avalon.noop,
        scrollPlugin: true,
        scrollSensitivity: 20,
        scrollSpeed: 20
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
        var dragstop = "mouseup"
    } else {
        dragstart = "touchstart"
        drag = "touchmove"
        dragstop = "touchend"
    }

    var draggable = avalon.bindingHandlers.draggable = function(data, vmodels) {
        var fnName = data.value.trim(), completeCallback, model
        for (var i = 0, vm; vm = vmodels[i++]; ) {
            if (vm.hasOwnProperty(fnName)) {//根据函数名找到对应的VM的$model
                if (typeof vm[fnName] === "function") {
                    completeCallback = vm[fnName]
                    model = vm.$model
                    break;
                }
            }
        }
        if (typeof completeCallback !== "function") {
            throw "此绑定的格式为： ms-draggable-optsName?=fn"
        }
        var optsName = data.param, opts
        if (/\w/.test(optsName)) {//根据ID找到对应的VM的$model
            if (model && typeof model[optsName] === "object") {
                opts = model[optsName]
            } else {
                for (var i = 0, vm; vm = vmodels[i++]; ) {
                    var object = vm.$model
                    if (object && typeof object[optsName] === "object") {
                        opts = object[optsName]
                        break;
                    }
                }
            }
        }

        opts = opts || model

        var element = data.element
        var $element = avalon(element)
        var options = avalon.mix({}, defaults, opts, $element.data());
        if (completeCallback) {
            options.stop = completeCallback
        }
 
        //修正drag,stop为函数
        "drag,stop,start,beforeStart,beforeStop".replace(avalon.rword, function(name) {
            var method = options[name]
            if (typeof method === "string") {
                if (typeof opts[method] === "function") {
                    options[name] = opts[method]
                } else {
                    options[name] = avalon.noop
                }
            }
        })
        if (options.axis !== "" && !/^(x|y|xy)$/.test(options.axis)) {
            options.axis = "xy"
        }
        body = document.body //因为到这里时，肯定已经domReady
        $element.bind(dragstart, function(e) {
            var data = avalon.mix({}, options, {
                element: element,
                $element: $element,
                pageX: getPosition(e, "X"), //相对于页面的坐标, 会改动
                pageY: getPosition(e, "Y"), //相对于页面的坐标，会改动
                marginLeft: parseFloat($element.css("marginLeft")),
                marginTop: parseFloat($element.css("marginTop"))
            })
        
            data.startPageX = data.pageX//一次拖放只赋值一次
            data.startPageY = data.pageY//一次拖放只赋值一次
            options.axis.toUpperCase().replace(/./g, function(x) {
                if (data["drag" + x] === void 0) {
                    data["drag" + x ] = true
                }
            })

            fixUserSelect()
            //在处理手柄拖动前做些事情

            options.beforeStart.call(element, e, data)
            draggable.plugin.call("beforeStart", e, data)
            if (data.handle && model) {// 实现手柄拖动
                var handle = model[data.handle]
                if (typeof handle === "function") {
                    var checked = handle.call(element, e, data)//要求返回一节点
                    if (checked && checked.nodeType === 1) {
                        if (!element.contains(checked)) {
                            return false
                        }
                    } else {
                        return false
                    }
                }
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

                avalon(clone).css("opacity", .5).width(element.offsetWidth).height(element.offsetHeight)

                data.clone = clone
                if (position !== "fixed") {
                    clone.style.position = "absolute"
                    clone.style.top = startOffset.top - data.marginTop + "px"
                    clone.style.left = startOffset.left - data.marginLeft + "px"
                }
                body.appendChild(clone)
            }
            var activeElement = document.activeElement
            if (activeElement && activeElement !== element) {
                activeElement.blur()
            }
            var target = avalon(data.clone || data.element)
            //拖动前相对于offsetParent的坐标
            data.startLeft = target.css("left", true) 
            data.startTop = target.css("top", true) 
            //拖动后相对于offsetParent的坐标
            //如果是影子拖动，代理元素是绝对定位时，它与原元素的top, left是不一致的，因此当结束拖放时，不能直接将改变量赋给原元素
            data.endLeft = $element.css("left", true) - data.startLeft
            data.endTop = $element.css("top", true)- data.startTop

            data.clickX = data.pageX - startOffset.left //鼠标点击的位置与目标元素左上角的距离
            data.clickY = data.pageY - startOffset.top //鼠标点击的位置与目标元素左上角的距离
            setContainment(options, data)//修正containment
            draggable.dragData = data//决定有东西在拖动
            "start,drag,beforeStop,stop".replace(avalon.rword, function(name) {
                draggable[name].unshift(options[name])
            })

            draggable.plugin.call("start", e, data)
        })

    }
    var xy2prop = {
        "X": "Left",
        "Y": "Top"
    }
    //插件系统
    draggable.start = []
    draggable.drag = []
    draggable.stop = []
    draggable.beforeStop = []
    draggable.plugin = {
        add: function(name, set) {
            for (var i in set) {
                var fn = set[i]
                if (typeof fn === "function" && Array.isArray(draggable[i])) {
                    fn.isPlugin = true
                    fn.pluginName = name + "Plugin"
                    draggable[i].push(fn)
                }
            }
        },
        call: function(name, e, data) {
            var array = draggable[name]
            if (Array.isArray(array)) {
                array.forEach(function(fn) {
                    //用户回调总会执行，插件要看情况
                    if (typeof fn.pluginName === "undefined" ? true : data[fn.pluginName]) {
                        fn.call(data.element, e, data)
                    }
                })
            }
            if (name === "stop") {
                for (var i in draggable) {
                    array = draggable[i]
                    if (Array.isArray(array)) {
                        array.forEach(function(fn) {
                            if (!fn.isPlugin) {// 用户回调都是一次性的，插件的方法永远放在列队中
                                avalon.Array.remove(array, fn)
                            }
                        })
                    }
                }
            }
        }
    }

    function getPosition(e, pos) {
        var page = "page" + pos
        return isMobile ? e.changedTouches[0][page] : e[page]
    }

    function setPosition(e, element, data, pos, end) {
        var page = getPosition(e, pos)
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
        data["page" + pos] = page//重设pageX, pageY
        var Prop = xy2prop[pos]
        var prop = Prop.toLowerCase()

        var number = data["start" + Prop] + page - data["startPage" + pos] + (end ? data["end" + Prop] : 0)

        data[prop] = number
        if (data["drag" + pos]) {//保存top, left
            element.style[ prop ] = number + "px"
        }
    }

    var styleEl = document.createElement("style")

    var cssText = "*{ -webkit-touch-callout: none!important;-webkit-user-select: none!important;-khtml-user-select: none!important;" +
            "-moz-user-select: none!important;-ms-user-select: none!important;user-select: none!important;}"
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
    //统一处理拖动的事件
    avalon(document).bind(drag, function(e) {
        var data = draggable.dragData
        if (!data || !data.started)
            return
        //fix touchmove bug;  
        //IE 在 img 上拖动时默认不能拖动（不触发 mousemove，mouseup 事件，mouseup 后接着触发 mousemove ...）
        //防止 html5 draggable 元素的拖放默认行为 (选中文字拖放)
        e.preventDefault();
        //使用document.selection.empty()来清除选择，会导致捕获失败 
        var element = data.clone || data.element

        setPosition(e, element, data, "X")
        setPosition(e, element, data, "Y")

        draggable.plugin.call("drag", e, data)
    })

    //统一处理拖动结束的事件
    avalon(document).bind(dragstop, function(e) {
        var data = draggable.dragData
        if (!data || !data.started)
            return
        restoreUserSelect()
        var element = data.element
        draggable.plugin.call("beforeStop", e, data)

        setPosition(e, element, data, "X", true)


        setPosition(e, element, data, "Y", true)

        if (data.clone) {
            body.removeChild(data.clone)
        }
        draggable.plugin.call("stop", e, data)
        delete draggable.dragData
    })



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

        if (Array.isArray(o.containment)) {
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
                    Math.floor($offset.left + elem.offsetWidth - data.marginLeft - data.$element.width()),
                    Math.floor($offset.top + elem.offsetHeight - data.marginTop - data.$element.height())
                ]

            }
        }
    }

    return avalon
})
/*
 ms-draggable-xxx-fn , xxx为一个VM的对象属性, fn为一个函数， fn不能删略，xxx可省
 下面这些全部可用data-*进行配置
 drag 为VM中一个方法名
 stop 为VM中一个方法名
 start  为VM中一个方法名
 handle  要求为VM中的一个函数，它会重置data.handle为一个元素节点，如果事件源位于data.handle的里面或等于它则继续进行操作
 ghosting: false, //是否影子拖动，动态生成一个元素，拖动此元素，当拖动结束时，让原元素到达此元素的位置上,
 delay: 0, 延迟时间
 axis: "xy" "x", "y" 决定只能垂直拖动，还是水平拖动，还是任意拖动
 containment： 拖动范围，#id值， "window", "document", "parent", "[0, 0, 400, 300]"
 <body ms-controller="xxx">
 <ul  ms-each-el="array">
 <li ms-draggable="complete" >item {{$index}}</li>
 </ul>
 </body>
 avalon.require("avalon.draggable", function() {
 avalon.define("xxx", function(vm) {
 vm.array = avalon.range(0, 10)
 vm.complete = function() {
 console.log("done")
 }
 vm.drag = function(e) {
 console.log(e.pageX + " : " + e.pageY)
 }
 })
 avalon.scan()
 })
 * 
 */