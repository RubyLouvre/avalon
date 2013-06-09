(function(avalon) {
    var root = avalon(document.documentElement),
            //支持触模设备
            supportTouch = "createTouch" in document || 'ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch,
            onstart = supportTouch ? "touchstart" : "mousedown",
            ondrag = supportTouch ? "touchmove" : "mousemove",
            onend = supportTouch ? "touchend" : "mouseup";
    //在元素标签上添加ms-drag="dragcallback" 就能用了，dragcallback为你在VM在定义的函数，它会在拖动时执行它
    //更在制定请在同一元素上设置data-*来制定，其中
    //data-axis="x" //值可以为x, y, xy，"", 没有设置值默认为xy, x为水平移移动，y为垂直移动, xy任意移动，""不给移
    //data-containment="parent" //值可以为window, document, parent，设置拖动的范围，没有设置就没有限制
    //data-movable="true|false"， 没有设置值默认为true，是否让框架帮你移动，否则自己在dragcallback中移动
    //data-dragstart="callback", 开始拖动时执行的回调 callback为VM的某个函数
    //data-dragend="callback", 结束拖动时执行的回调
    //所有回调都有两个参数，event与data，data包含你所有data=*属性，与top, left, range, el, $el等属性

    scrollParent = function(node) {
        var pos = node.css("position"), parent;
        if ((window.VBArray && (/(static|relative)/).test(pos)) || (/absolute/).test(pos)) {
            parent = node[0];
            while (parent = parent.parentNode) {
                var temp = avalon(parent);
                var overflow = temp.css("overflow") + temp.css("overflow-y") + temp.css("overflow-x");
                if (/(relative|absolute|fixed)/.test(temp.css("position")) && /(auto|scroll)/.test(overflow)) {
                    break;
                }
            }
        } else {
            parent = node[0];
            while (parent = parent.parentNode) {
                var temp = avalon(parent);
                var overflow = temp.css("overflow") + temp.css("overflow-y") + temp.css("overflow-x");
                if (/(auto|scroll)/.test(overflow)) {
                    break;
                }
            }
        }
        parent = parent !== node[0] ? parent : null;
        return(/fixed/).test(pos) || !parent ? document : parent;
    };
    var defaults = {
        scrollSensitivity: 20,
        scrollSpeed: 20,
        movable: true,
        dragstart: avalon.noop,
        drag: avalon.noop,
        dragend: avalon.noop,
        beforestart: avalon.noop,
        scroll: true
    };
    function getXY(event, a) {
        var prop = "page" + a;
        return supportTouch ? event.targetTouches[0][prop] : event[prop];
    }
    var draggable = avalon.bindingHandlers.draggable = function(meta, scopes) {
        var element = meta.element;
        var $element = avalon(element);
        var data = avalon.mix({}, defaults);
        avalon.mix(data, $element.data());
        var axis = data.axis;
        if (axis !== "" && !/^(x|y|xy)$/.test(axis)) {
            data.axis = "xy";
        }

        function get(name) {
            var ret;
            for (var i = 0, scope; scope = scopes[i++]; ) {
                if (scope.hasOwnProperty(name)) {
                    ret = scope[name];
                    break;
                }
            }
            return ret;
        }
        data.drag = get(meta.value) || avalon.noop;
        "beforestart, dragstart, dragend".replace(avalon.rword, function(name) {
            var fn = get(data[name] || "");
            if (typeof fn === "function") {
                data[name] = fn;
            }
        });
        data.movable = data.movable !== false;
        data.element = element;
        data.$element = $element;
        function toFloat(a) {
            return parseFloat(a) || 0;
        }

        $element.bind(onstart, function(event) {
            data.beforestart.call(data.element, event, data);
            setDragRange(data);
            textselect(true);
            data.startX = getXY(event, "X");
            data.startY = getXY(event, "Y");
            var position = data.$element.position();
            var offset = data.$element.offset();
            if (data.containment === "window") {
                position = data.element.getBoundingClientRect();
                data.originalX = position.left;
                data.originalY = position.top;
            } else {
                data.originalX = data.originalX || position.left + data.startX - offset.left;
                data.originalY = data.originalY || position.top + data.startY - offset.top;
            }
            if (data.scroll) {
                data.scrollParent = scrollParent(data.$element);
                data.overflowOffset = avalon(data.scrollParent).offset();
            }
             // element.setCapture();有副作用
            if (window.captureEvents) {
                window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
            }
            draggable.queue.push(data);
            data.dragstart.call(data.element, event, data);
        });
    };
    draggable.queue = [];
    draggable.underway = [];
    draggable.dropscene = [];

    function drag(event) {
        draggable.queue.forEach(function(data) {
            event.preventDefault();
            //当前元素移动了多少距离
            data.deltaX = getXY(event, "X") - data.startX;
            data.deltaY = getXY(event, "Y") - data.startY;
            //现在的坐标
            data.offsetX = data.deltaX + data.originalX;
            data.offsetY = data.deltaY + data.originalY;
            if (data.axis.indexOf("x") !== -1) { //如果没有锁定X轴left,top,right,bottom
                var left = data.range ? Math.min(data.range[2], Math.max(data.range[0], data.offsetX)) : data.offsetX;
                if (data.movable) {
                    data.element.style.left = left + "px";
                }
                data.left = left;
            }
            if (data.axis.indexOf("y") !== -1) { //如果没有锁定Y轴
                var top = data.range ? Math.min(data.range[3], Math.max(data.range[1], data.offsetY)) : data.offsetY;
                if (data.movable) {
                    data.element.style.top = top + "px";
                }
                data.top = top;
            }
            setDragScroll(event, data);
            data.drag.call(data.element, event, data);
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            } else {
                document.selection.empty();
            }
        });
    }

    function dragEnd(event) {
        draggable.queue.forEach(function(data) {
            data.originalX = data.left;
            data.originalY = data.top;
            // data.element.releaseCapture();有副作用
            if (window.releaseEvents) {
                window.releaseEvents(Event.MOUSEMOVE | Event.MOUSEUP);
            }
            textselect(false);
            data.dragend.call(data.element, event, data);
        });
        draggable.queue.length = 0;

    }
    draggable.underway.push(drag);
    draggable.dropscene.push(dragEnd);
    function toFloat(a) {
        return parseFloat(a) || 0;
    }
    avalon.fn.position = function() { //取得元素相对于其offsetParent的坐标，实现拖动的关键
        var node = this[0], parentOffset = {//默认的offsetParent相对于视窗的距离
            top: 0,
            left: 0
        };
        if (!node || node.nodeType !== 1) {
            return offsetParent;
        }
        //fixed 元素是相对于window
        if (this.css("position") === "fixed") {
            var offset = node.getBoundingClientRect();
        } else {
            offset = this.offset(); //得到元素相对于视窗的距离（我们只有它的top与left）
            var offsetParent = avalon(node.offsetParent);
            //得到它的offsetParent相对于视窗的距离
            parentOffset = /html|body/i.test(offsetParent[0].nodeName) ? parentOffset : offsetParent.offset();
            parentOffset.top += toFloat(offsetParent.css("borderTopWidth"));
            parentOffset.left += toFloat(offsetParent.css("borderLeftWidth"));
        }
        return {
            top: offset.top - parentOffset.top - toFloat(this.css("marginTop")),
            left: offset.left - parentOffset.left - toFloat(this.css("marginLeft"))
        };
    };
    function setDragRange(data) {
        var range = data.containment; //处理区域鬼拽,确认可活动的范围
        var node = data.element;
        var isDoc = range === "document";
        if (range) {
            if (Array.isArray(range) && range.length === 4) { //如果传入的是坐标 [x1,y1,x2,y2] left,top,right,bottom
                data.range = range;
            } else {
                if (range === "parent") { //如果是parent参数
                    range = node.parentNode;
                }
                if (isDoc || range === "window") { //如果是document|window参数
                    data.range = [0, 0];
                    data.range[2] = data.range[0] + avalon(isDoc ? document : window).width();
                    data.range[3] = data.range[1] + avalon(isDoc ? document : window).height();
                } else { //如果是元素节点(比如从parent参数转换地来),或者是CSS表达式,或者是mass对象
                    data.range = [0, 0, range.clientWidth, range.clientHeight];
                    if (range !== node.offsetParent) {
                        var p = avalon(range).offset();//parentNode
                        var o = avalon(node.offsetParent).offset();//offsetParent
                        var fixX = p.left - o.left;
                        var fixY = p.top - o.top;
                        data.range[0] += fixX;
                        data.range[2] += fixX;
                        data.range[1] += fixY;
                        data.range[3] += fixY;
                    }
                }
            }
            if (Array.isArray(data.range)) {
                data.range[2] = data.range[2] - node.clientWidth;
                data.range[3] = data.range[3] - node.clientHeight;
            }

        }
    }
    function textselect(bool) {
        //放于鼠标按下或弹起处的回调中,用于开启或禁止文本选择
        root.css("-user-select", bool ? "" : "none");
        document.unselectable = bool ? "off" : "on";
    }
    ;
    function setDragScroll(event, data, docLeft, docTop) {
        if (data.scroll) {
            if (data.scrollParent != document && data.scrollParent.tagName !== 'HTML') {
                if (data.axis.indexOf("x") !== -1) {
                    if ((data.overflowOffset.left + data.scrollParent.offsetWidth) - event.pageX < data.scrollSensitivity) {
                        data.scrollParent.scrollLeft = data.scrollParent.scrollLeft + data.scrollSpeed;
                    } else if (event.pageX - data.overflowOffset.left < data.scrollSensitivity) {
                        data.scrollParent.scrollLeft = data.scrollParent.scrollLeft - data.scrollSpeed;
                    }
                }
                if (data.axis.indexOf("y") !== -1) {
                    if ((data.overflowOffset.top + data.scrollParent.offsetHeight) - event.pageY < data.scrollSensitivity) {
                        data.scrollParent.scrollTop = data.scrollParent.scrollTop + data.scrollSpeed;
                    } else if (event.pageY - data.overflowOffset.top < data.scrollSensitivity) {
                        data.scrollParent.scrollTop = data.scrollParent.scrollTop - data.scrollSpeed;
                    }
                }

            } else {
                docLeft = docLeft || root.scrollLeft();
                docTop = docTop || root.scrollTop();
                if (data.axis.indexOf("x") !== -1) {
                    if (event.pageX - docLeft < data.scrollSensitivity) {
                        root.scrollLeft(docLeft - data.scrollSpeed);
                    } else if (avalon(window).width() - event.pageX + docLeft < data.scrollSensitivity) {
                        root.scrollLeft(docLeft + data.scrollSpeed);
                    }
                }
                if (data.axis.indexOf("y") !== -1) {
                    if (event.pageY - docTop < data.scrollSensitivity) {
                        root.scrollTop(docTop - data.scrollSpeed);
                    } else if (avalon(window).height() - event.pageY + docTop < data.scrollSensitivity) {
                        root.scrollTop(docTop + data.scrollSpeed);
                    }
                }
            }
        }
    }
    function getWindow(elem) {//只对window与document取值
        return elem.window && elem.document ?
                elem :
                elem.nodeType === 9 ?
                elem.defaultView || elem.parentWindow :
                false;
    }
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

    //使用事件代理提高性能
    root.bind(ondrag, function(e) {

        for (var i = 0, fn; fn = draggable.underway[i++]; ) {
            var ret = fn(e);
        }
        return ret;
    });
    root.bind(onend, function(e) {
        for (var i = 0, fn; fn = draggable.dropscene[i++]; ) {
            var ret = fn(e);
        }
        return ret;
    });

})(window.avalon);