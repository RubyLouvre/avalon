//来源自此组件 http://acko.net/blog/farbtastic-jquery-color-picker-plug-in/
define(["avalon.position, avalon.draggable", "css!colorroller"], function(avalon) {
    var lockTime = new Date - 0, minTime = document.querySelector ? 12 : 30
    var ua = navigator.userAgent;
    var isAndroid = /Android/i.test(ua);
    var isBlackBerry = /BlackBerry/i.test(ua)
    var isWindowPhone = /IEMobile/i.test(ua)
    var isIOS = /iPhone|iPad|iPod/i.test(ua)
    var isMobile = isAndroid || isBlackBerry || isWindowPhone || isIOS
    if (!isMobile) {
        var dragstartN = "mousedown"
        var dragN = "mousemove"
        var dragstopN = "mouseup"
    } else {
        dragstartN = "touchstart"
        dragN = "touchmove"
        dragstopN = "touchend"
    }
    function getPosition(e, pos) {
        var page = "page" + pos
        return isMobile ? e.changedTouches[0][page] : e[page]
    }
    var widget = avalon.ui["colorroller"] = function(element, data, vmodels) {
        var options = data.colorrollerOptions
        var tmpl = '<div class="ui-colorroller" ms-blur="hide" tabindex=-1 ms-on-' + dragstartN + '="mousedown" ms-visible="toggle"><div class="color" ms-css-background="backgroundColor"></div>' +
                '<div class="wheel"></div><div class="overlay"></div>' +
                '<div class="h-marker marker" ms-css-top="{{htop}}px" ms-css-left="{{hleft}}px"></div>' +
                '<div class="sl-marker marker" ms-css-top="{{sltop}}px" ms-css-left="{{slleft}}px"></div></div>'
        var roller = avalon.parseHTML(tmpl).firstChild
        var wheel
        for (var i = 0, el; el = roller.childNodes[i++]; ) {
            if (el.nodeType == 1 && /wheel/.test(el.className)) {
                wheel = el
                break;
            }
        }
        var model = avalon.define(data.colorrollerId, function(vm) {
            avalon.mix(vm, options)
            vm.wheel = wheel
            vm.skipArray = ["hsl", "rgb", "wheel", "width", "circleDrag"]
            vm.hide = function() {
                vm.toggle = false
            }
            vm.show = function() {
                vm.toggle = true
            }
            vm.$watch("toggle", function(a) {
                if (a) {
                    avalon(roller).position({
                        of: element,
                        at: "left bottom",
                        my: "left top"
                    })
                }
            })
            /**
             * Change color with HTML syntax #123456
             */
            vm.setColor = function(color) {
                var unpack = widget.unpack(color)

                if (unpack) {
                    model.color = color;
                    model.rgb = unpack;
                    model.hsl = widget.RGBToHSL(model.rgb)

                    model.updateDisplay()
                }
            }

            /**
             * Change color with HSL triplet [0..1, 0..1, 0..1]
             */
            vm.setHSL = function(hsl) {
                model.hsl = hsl;
                model.rgb = widget.HSLToRGB(hsl)
                model.color = widget.pack(model.rgb)
                model.updateDisplay()
            }
            vm.updateDisplay = function() {
                var angle = model.hsl[0] * 6.28;
                model.hleft = Math.round(Math.sin(angle) * model.radius + model.width / 2)
                model.htop = Math.round(-Math.cos(angle) * model.radius + model.width / 2)

                model.slleft = Math.round(model.square * (.5 - model.hsl[1]) + model.width / 2)
                model.sltop = Math.round(model.square * (.5 - model.hsl[2]) + model.width / 2)
                model.backgroundColor = widget.pack(widget.HSLToRGB([model.hsl[0], 1, 0.5]))

                if (element.value !== model.color)
                    element.value = model.color

                if (typeof options.callback == 'function') {
                    options.callback.call(model, model.color)
                }
            }
            vm.mousedown = function(event) {
                // Capture mouse
                if (!widget.dragging) {
                    widget.mousemoveFn = avalon(document).bind('mousemove', vm.mousemove)
                    widget.mouseup = avalon(document).bind('mouseup', vm.mouseup)
                    widget.dragging = true;
                }
                //取得鼠标点击位置于组件容器的位置
                var pos = vm.widgetCoords(event)
                //判定是在环状里还是内圆里点击
                vm.circleDrag = Math.max(Math.abs(pos.x), Math.abs(pos.y)) * 2 > vm.square;
                vm.mousemove(event, true)
            }

            vm.mousemove = function(event, force) {
                var time = event.timeStamp - lockTime
                if (force || time > minTime) {//减少调用次数，防止卡死IE6-8
                    lockTime = event.timeStamp
                    var pos = model.widgetCoords(event)
                    if (model.circleDrag) {
                        var hue = Math.atan2(pos.x, -pos.y) / 6.28;
                        if (hue < 0)
                            hue += 1;
                        model.setHSL([hue, model.hsl[1], model.hsl[2]])
                    } else {
                        var sat = Math.max(0, Math.min(1, -(pos.x / model.square) + .5))
                        var lum = Math.max(0, Math.min(1, -(pos.y / model.square) + .5))
                        model.setHSL([model.hsl[0], sat, lum])
                    }
                }
                return false;
            }
            vm.mouseup = function() {
                avalon(document).unbind(dragN, widget.mousemoveFn)
                avalon(document).unbind(dragstopN, widget.mouseupFn)
                widget.dragging = false;
            }
            vm.$watch("color", function(a) {
                vm.setColor(a)
            })
            vm.widgetCoords = function(event) {
                var pos = widget.absolutePosition(model.wheel)
                var x = getPosition(event, "X") - pos.x;
                var y = getPosition(event, "Y") - pos.y;
                return {x: x - model.width / 2, y: y - model.width / 2};
            }
        })
        model.setColor('#541256')
        avalon.ready(function() {
            document.body.appendChild(roller)
            avalon.scan(roller, [model].concat(vmodels))
            element.setAttribute("ms-duplex", "color")
            element.setAttribute("ms-focus", "show")
            avalon.scan(element, model)
            if (typeof document.documentElement.style.maxHeight === "undefined") {
                avalon.each(roller.getElementsByTagName("div"), function(i, el) {
                    if (el.nodeType == 1 && el.currentStyle.backgroundImage != 'none') {
                        var image = el.currentStyle.backgroundImage;
                        image = el.currentStyle.backgroundImage.substring(5, image.length - 2)
                        el.style.backgroundImage = "none"
                        el.style.zoom = 1
                        el.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod=crop, src='" + image + "')"
                    }
                })
            }
        })
    }
    widget.defaults = {
        radius: 84,
        square: 100,
        width: 194,
        color: "",
        backgroundColor: "",
        rgb: [],
        hsl: [0, 0, 0],
        htop: NaN,
        hleft: NaN,
        sltop: NaN,
        slleft: NaN,
        circleDrag: false,
        toggle: false //是否显示
    }

    /* Get absolute position of element   */
    widget.absolutePosition = function(el) {
        var r = {x: el.offsetLeft, y: el.offsetTop};
        // Resolve relative to offsetParent
        if (el.offsetParent) {
            var tmp = widget.absolutePosition(el.offsetParent)
            r.x += tmp.x;
            r.y += tmp.y;
        }
        return r;
    };

    /* Various color utility functions */
    widget.pack = function(rgb) {
        var r = Math.round(rgb[0] * 255)
        var g = Math.round(rgb[1] * 255)
        var b = Math.round(rgb[2] * 255)
        return '#' + (r < 16 ? '0' : '') + r.toString(16) +
                (g < 16 ? '0' : '') + g.toString(16) +
                (b < 16 ? '0' : '') + b.toString(16)
    }

    widget.unpack = function(color) {
        if (color.length == 7) {
            return [parseInt('0x' + color.substring(1, 3)) / 255,
                parseInt('0x' + color.substring(3, 5)) / 255,
                parseInt('0x' + color.substring(5, 7)) / 255];
        }
        else if (color.length == 4) {
            return [parseInt('0x' + color.substring(1, 2)) / 15,
                parseInt('0x' + color.substring(2, 3)) / 15,
                parseInt('0x' + color.substring(3, 4)) / 15];
        }
    }

    widget.HSLToRGB = function(hsl) {
        var m1, m2, r, g, b;
        var h = hsl[0], s = hsl[1], l = hsl[2];
        m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
        m1 = l * 2 - m2;
        return [widget.hueToRGB(m1, m2, h + 0.33333),
            widget.hueToRGB(m1, m2, h),
            widget.hueToRGB(m1, m2, h - 0.33333)];
    }

    widget.hueToRGB = function(m1, m2, h) {
        h = (h < 0) ? h + 1 : ((h > 1) ? h - 1 : h)
        if (h * 6 < 1)
            return m1 + (m2 - m1) * h * 6;
        if (h * 2 < 1)
            return m2;
        if (h * 3 < 2)
            return m1 + (m2 - m1) * (0.66666 - h) * 6;
        return m1;
    }

    widget.RGBToHSL = function(rgb) {
        var min, max, delta, h, s, l;
        var r = rgb[0], g = rgb[1], b = rgb[2];
        min = Math.min(r, Math.min(g, b))
        max = Math.max(r, Math.max(g, b))
        delta = max - min;
        l = (min + max) / 2;
        s = 0;
        if (l > 0 && l < 1) {
            s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l))
        }
        h = 0;
        if (delta > 0) {
            if (max == r && max != g)
                h += (g - b) / delta;
            if (max == g && max != b)
                h += (2 + (b - r) / delta)
            if (max == b && max != r)
                h += (4 + (r - g) / delta)
            h /= 6;
        }
        return [h, s, l];
    }
    return avalon
})
