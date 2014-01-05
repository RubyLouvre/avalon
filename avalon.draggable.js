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
    function filterData(obj, prefix) {
        var result = {}
        for (var i in obj) {
            if (i.indexOf(prefix) === 0) {
                result[  i.replace(prefix, "").replace(/\w/, function(a) {
                    return a.toLowerCase()
                }) ] = obj[i]
            }
        }
        return result
    }
    var draggable = avalon.bindingHandlers.draggable = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || [""]
        var ID = args[0].trim(), opts = args[1], model, vmOptions
        if (ID && ID != "$") {
            model = avalon.vmodels[ID]//如果指定了此VM的ID
            if (!model) {
                data.remove = false
                return
            }
        }
        if (!model) {//如果使用$或绑定值为空，那么就默认取最近一个VM，没有拉倒
            model = vmodels.length ? vmodels[0] : null
        }
        var fnObj = model || {}
        if (opts && model && typeof model[opts] === "object") {//如果指定了配置对象，并且有VM
            vmOptions = model[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
            fnObj = vmOptions
        }
        var element = data.element
        var $element = avalon(element)
        var options = avalon.mix({}, defaults, vmOptions || {}, filterData($element.data(), "drag"));
        //修正drag,stop为函数
        "drag,stop,start,beforeStart,beforeStop".replace(avalon.rword, function(name) {
            var method = options[name]
            if (typeof method === "string") {
                if (typeof fnObj[method] === "function") {
                    options[name] = fnObj[method]
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
                marginLeft: parseFloat($element.css("marginLeft")) || 0,
                marginTop: parseFloat($element.css("marginTop")) || 0
            })

            data.startPageX = data.pageX//一次拖放只赋值一次
            data.startPageY = data.pageY//一次拖放只赋值一次
            options.axis.replace(/./g, function(a) {
                data["drag" + a.toUpperCase() ] = true
            })
            if (!data.dragX && !data.dragY) {
                data.started = false
            }
            //在处理手柄拖动前做些事情
            if (typeof options.beforeStart === "function") {
                options.beforeStart.call(data.element, e, data)
            }

            if (data.handle && fnObj) {// 实现手柄拖动
                var handle = fnObj[data.handle]
                if (typeof handle === "function") {
                    var checked = handle.call(element, e, data)//要求返回一节点
                    if (checked && checked.nodeType === 1) {
                        if (!element.contains(checked)) {
                            return // 不能返回 false，这会阻止文本被选择
                        }
                    } else {
                        return
                    }
                }
            }
            fixUserSelect()
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
                avalon(clone).css("opacity", .7).width(element.offsetWidth).height(element.offsetHeight)
                data.clone = clone
                if (position !== "fixed") {
                    clone.style.position = "absolute"
                    clone.style.top = startOffset.top - data.marginTop + "px"
                    clone.style.left = startOffset.left - data.marginLeft + "px"
                }
                body.appendChild(clone)
            }
            var target = avalon(data.clone || data.element)
            //拖动前相对于offsetParent的坐标
            data.startLeft = parseFloat(target.css("left"))
            data.startTop = parseFloat(target.css("top"))

            //拖动后相对于offsetParent的坐标
            //如果是影子拖动，代理元素是绝对定位时，它与原元素的top, left是不一致的，因此当结束拖放时，不能直接将改变量赋给原元素
            data.endLeft = parseFloat($element.css("left")) - data.startLeft
            data.endTop = parseFloat($element.css("top")) - data.startTop

            data.clickX = data.pageX - startOffset.left //鼠标点击的位置与目标元素左上角的距离
            data.clickY = data.pageY - startOffset.top //鼠标点击的位置与目标元素左上角的距离
            setContainment(options, data)//修正containment
            draggable.dragData = data//决定有东西在拖动
            "start,drag,beforeStop,stop".replace(avalon.rword, function(name) {
                draggable[name] = [options[name]]
            })
            draggable.plugin.call("start", e, data)
        })

    }
    var xy2prop = {
        "X": "Left",
        "Y": "Top"
    }
    //插件系统
    draggable.dragData = {}
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
    var fixUserSelect = function() {
        body.appendChild(styleEl)
        //如果不插入DOM树，styleEl.styleSheet为null
        if (typeof styleEl.styleSheet === "object") {
            styleEl.styleSheet.cssText = cssText
        } else {
            styleEl.appendChild(document.createTextNode(cssText))
        }
    }
    var restoreUserSelect = function() {
        try {
            styleEl.innerHTML = ""
        } catch (e) {
            styleEl.styleSheet.cssText = ""
        }
        body.removeChild(styleEl)
    }
    if (window.VBArray && !("msUserSelect" in document.documentElement.style)) {
        var _ieSelectBack;//fix IE6789
        function returnFalse(event) {
            event.returnValue = false
        }
        fixUserSelect = function() {
            _ieSelectBack = body.onselectstart;
            body.onselectstart = returnFalse;
        }
        restoreUserSelect = function() {
            body.onselectstart = _ieSelectBack;
        }
    }
    //统一处理拖动的事件
    var lockTime = new Date - 0, minTime = document.querySelector ? 12 : 30
    avalon(document).bind(drag, function(e) {
        var time = new Date - lockTime
        if (time > minTime) {//减少调用次数，防止卡死IE6-8
            lockTime = time
            var data = draggable.dragData
            if (data.started === true) {
                //fix touchmove bug;  
                //IE 在 img 上拖动时默认不能拖动（不触发 mousemove，mouseup 事件，mouseup 后接着触发 mousemove ...）
                //防止 html5 draggable 元素的拖放默认行为 (选中文字拖放)
                e.preventDefault();
                //使用document.selection.empty()来清除选择，会导致捕获失败 
                var element = data.clone || data.element
                setPosition(e, element, data, "X")
                setPosition(e, element, data, "Y")
                draggable.plugin.call("drag", e, data)
            }
        }
    })

    //统一处理拖动结束的事件
    avalon(document).bind(dragstop, function(e) {
        var data = draggable.dragData
        if (data.started === true) {
            restoreUserSelect()
            var element = data.element
            draggable.plugin.call("beforeStop", e, data)
            if (data.dragX) {
                setPosition(e, element, data, "X", true)
            }
            if (data.dragY) {
                setPosition(e, element, data, "Y", true)
            }
            if (data.clone) {
                body.removeChild(data.clone)
            }
            draggable.plugin.call("stop", e, data)
            draggable.dragData = {}
        }
    })



    function getWindow(node) {
        return node.window && node.document ? node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
    }
    function setContainment(o, data) {
        if (!o.containment) {
            if (Array.isArray(data.containment)) {
                return
            }
            data.containment = null;
            return;
        }

        if (o.containment === "window") {
            var $window = avalon(window)
            //左， 上， 右， 下
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
 ms-draggable="VMID?" , VMID为一个VM的ID,可选
 下面这些全部可用data-drag-*进行配置
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
 <li ms-draggable="xxx" >item {{$index}}</li>
 </ul>
 </body>
 avalon.require("avalon.draggable", function() {
 avalon.define("xxx", function(vm) {
 vm.array = avalon.range(0, 10)
 vm.drag = function(e, data) {
 console.log(e.pageX + " : " + e.pageY)
 }
 vm.stop = function(e, data) {
 console.log("done")
 }
 })
 avalon.scan()
 })
 * 
 */