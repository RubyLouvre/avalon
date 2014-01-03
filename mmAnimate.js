define(["avalon"], function(avalon) {
    var types = {
        color: /backgroundavalon|color/i,
        scroll: /scroll/i
    }

    var rfxnum = /^([+\-/*]=)?([\d+.\-]+)([a-z%]*)avalon/i
    avalon.mix({
        easing: {//缓动公式
            linear: function(pos) {
                return pos
            },
            swing: function(pos) {
                return (-Math.cos(pos * Math.PI) / 2) + 0.5
            }
        },
        fps: 30,
        isHidden: function(node) {
            return  node.sourceIndex === 0 || avalon.css(node, "display") === "none" || !avalon.contains(node.ownerDocument, node)
        }
    })


    //==============================中央列队=======================================
    var timeline = avalon.timeline = [] //时间轴

    function insertFrame(frame) { //插入包含关键帧原始信息的帧对象
        if (frame.queue) { //如果指定要排队
            var gotoQueue = 1
            for (var i = timeline.length, el; el = timeline[--i]; ) {
                if (el.node === frame.node) { //★★★第一步
                    el.positive.push(frame) //子列队
                    gotoQueue = 0
                    break
                }
            }
            if (gotoQueue) { //★★★第二步
                timeline.unshift(frame)
            }
        } else {
            timeline.push(frame)
        }
        if (insertFrame.id === null) { //只要数组中有一个元素就开始运行
            insertFrame.id = setInterval(deleteFrame, 1000 / avalon.fps)
        }
    }
    insertFrame.id = null

    function deleteFrame() {
        //执行动画与尝试删除已经完成或被强制完成的帧对象
        var i = timeline.length
        while (--i >= 0) {
            if (!timeline[i].paused) { //如果没有被暂停
                if (!(timeline[i].node && enterFrame(timeline[i], i))) {
                    timeline.splice(i, 1)
                }
            }
        }
        timeline.length || (clearInterval(insertFrame.id), insertFrame.id = null)
    }
    //==============================裁剪用户传参到可用状态===========================
    function addOption(opts, p) {
        switch (avalon.type(p)) {
            case "object":
                addCallback(opts, p, "after")
                addCallback(opts, p, "before")
                avalon.mix(opts, p)
                break
            case "number":
                opts.duration = p
                break
            case "string":
                opts.easing = p
                break
            case "function":
                opts.complete = p
                break
        }
    }
    function addOptions(properties) {
        if (isFinite(properties)) { //如果第一个为数字
            return {
                duration: properties
            }
        }
        var opts = {}
        //如果第二参数是对象
        for (var i = 1; i < arguments.length; i++) {
            addOption(opts, arguments[i])
        }
        opts.duration = typeof opts.duration === "number" ? opts.duration : 400
        opts.queue = !!(opts.queue == null || opts.queue) //默认进行排队
        opts.easing = avalon.easing[opts.easing] ? opts.easing : "swing"
        opts.update = true
        return opts
    }

    function addCallback(target, source, name) {
        if (typeof source[name] === "function") {
            var fn = target[name]
            if (fn) {
                target[name] = function(node, fx) {
                    fn(node, fx)
                    source[name](node, fx)
                }
            } else {
                target[name] = source[name]
            }
        }
        delete source[name]
    }
    //.animate( properties [, duration] [, easing] [, complete] )
    //.animate( properties, options )
    var effect = avalon.fn.animate = avalon.fn.fx = function(props) {
        //将多个参数整成两个，第一参数暂时别动
        var opts = addOptions.apply(null, arguments),
                p
        //第一个参数为元素的样式，我们需要将它们从CSS的连字符风格统统转为驼峰风格，
        //如果需要私有前缀，也在这里加上
        for (var name in props) {
            p = avalon.cssName(name) || name
            if (name !== p) {
                props[p] = props[name] //添加borderTopWidth, styleFloat
                delete props[name] //删掉border-top-width, float
            }
        }

        //包含关键帧的原始信息的对象到主列队或子列队。
        insertFrame(avalon.mix({
            positive: [], //正向列队
            negative: [], //外队列队
            node: this[0], //元素节点
            props: props //@keyframes中要处理的样式集合
        }, opts))

        return this
    }
    effect.updateHooks = {
        _default: function(node, per, end, obj) {
            avalon.css(node, obj.name, (end ? obj.to : obj.from + obj.easing(per) * (obj.to - obj.from)) + obj.unit)
        },
        color: function(node, per, end, obj) {
            var pos = obj.easing(per),
                    rgb = end ? obj.to : obj.from.map(function(from, i) {
                return Math.max(Math.min(parseInt(from + (obj.to[i] - from) * pos, 10), 255), 0)
            })
            node.style[obj.name] = "rgb(" + rgb + ")"
        },
        scroll: function(node, per, end, obj) {
            node[obj.name] = (end ? obj.to : obj.from + obj.easing(per) * (obj.to - obj.from))
        }
    }
    function getInitVal(node, prop) {
        if (isFinite(node[prop])) { //scrollTop/ scrollLeft
            return node[prop]
        }
        var result = avalon.css(node, prop)
        return !result || result === "auto" ? 0 : result
    }

    function getFxType(attr) { //  用于取得适配器的类型
        for (var i in types) {
            if (types[i].test(attr)) {
                return i
            }
        }
        return "_default"
    }
    var inlineBlockNeedsLayout = !window.getComputedStyle
    var AnimationPreproccess = {
        noop: avalon.noop,
        show: function(node, frame) {
            //show 开始时计算其width1 height1 保存原来的width height display改为inline-block或block overflow处理 赋值（width1，height1）
            //hide 保存原来的width height 赋值为(0,0) overflow处理 结束时display改为none;
            //toggle 开始时判定其是否隐藏，使用再决定使用何种策略
            if (avalon.isHidden(node)) {
                var display = node.__olddisplay__
                if (!display || display === "none") {
                    display = avalon.parseDisplay(node.nodeName)
                    node.__olddisplay__ = display
                }
                node.style.display = display
                if ("width" in frame.props || "height" in frame.props) { //如果是缩放操作
                    //修正内联元素的display为inline-block，以让其可以进行width/height的动画渐变
                    if (display === "inline" && avalon.css(node, "float") === "none") {
                        if (inlineBlockNeedsLayout) { //IE
                            if (display === "inline") {
                                node.style.display = "inline-block"
                            } else {
                                node.style.display = "inline"
                                node.style.zoom = 1
                            }
                        }
                    } else { //W3C
                        node.style.display = "inline-block"
                    }
                }
            }
        },
        hide: function(node, frame) {
            if (avalon.isHidden(node)) {
                var display = avalon.css(node, "display"),
                        s = node.style
                if (display !== "none" && !node.__olddisplay__) {
                    node.__olddisplay__ = display
                }
                var overflows
                if ("width" in frame.props || "height" in frame.props) { //如果是缩放操作
                    //确保内容不会溢出,记录原来的overflow属性，
                    //因为IE在改变overflowX与overflowY时，overflow不会发生改变
                    overflows = [s.overflow, s.overflowX, s.overflowY]
                    s.overflow = "hidden"
                }
                var fn = frame.after || avalon.noop
                frame.after = function(node, fx) {
                    if (fx.method === "hide") {
                        node.style.display = "none"
                        for (var i in fx.orig) { //还原为初始状态
                            avalon.css(node, i, fx.orig[i])
                        }
                    }
                    if (overflows) {
                        ["", "X", "Y"].forEach(function(postfix, index) {
                            s["overflow" + postfix] = overflows[index]
                        })
                    }
                    fn(node, fx)
                }
            }
        },
        toggle: function(node, fx) {
            avalon[avalon.isHidden(node) ? "show" : "hide"](node, fx)
        }
    }
    function parseFrames(node, fx, index) {
        //用于生成动画实例的关键帧（第一帧与最后一帧）所需要的计算数值与单位，并将回放用的动画放到negative子列队中去
        var to, parts, unit, op, props = [],
                revertProps = [],
                orig = {},
                hidden = avalon.isHidden(node),
                hash = fx.props,
                easing = fx.easing  //公共缓动公式
        if (!hash.length) {
            for (var name in hash) {
                if (!hash.hasOwnProperty(name)) {
                    continue
                }
                var val = hash[name] //取得结束值
                var type = getFxType(name) //取得类型
                var from = getInitVal(node, name) //取得起始值
                //处理 toggle, show, hide
                if (val === "toggle") {
                    val = hidden ? "show" : "hide"
                }
                if (val === "show") {
                    fx.method = val
                    val = from
                    from = 0
                    avalon.css(node, name, 0)
                } else if (val === "hide") {
                    fx.method = val
                    orig[name] = from
                    val = 0
                }
                //用于分解属性包中的样式或属性,变成可以计算的因子
                if (type === "color") {
                    parts = [color2array(from), color2array(val)]
                } else {
                    from = parseFloat(from) //确保from为数字
                    if ((parts = rfxnum.exec(val))) {
                        to = parseFloat(parts[2]), //确保to为数字
                                unit = avalon.cssNumber[name] ? 0 : (parts[3] || "px")
                        if (parts[1]) {
                            op = parts[1].charAt(0)  //操作符
                            if (unit && unit !== "px" && (op === "+" || op === "-")) {
                                avalon.css(node, name, (to || 1) + unit)
                                from = ((to || 1) / parseFloat(avalon.css(node, name))) * from
                                avalon.css(node, name, from + unit)
                            }
                            if (op) { //处理+=,-= \= *=
                                to = eval(from + op + to)
                            }
                        }
                        parts = [from, to]
                    } else {
                        parts = [0, 0]
                    }
                }
                from = parts[0]
                to = parts[1]
                if (from + "" === to + "") { //不处理初止值都一样的样式与属性
                    continue
                }
                var prop = {
                    name: name,
                    from: from,
                    to: to,
                    type: type,
                    easing: avalon.easing[easing],
                    unit: unit
                }
                props.push(prop)
                revertProps.push(avalon.mix({}, prop, {
                    to: from,
                    from: to
                }))
            }
            fx.props = props
            fx.revertProps = revertProps
            fx.orig = orig
        }

        if (fx.record || fx.revert) {
            var fx2 = {}  //回滚到最初状态
            for (name in fx) {
                fx2[name] = fx[name]
            }
            delete fx2.revert
            fx2.props = fx.revertProps.concat()
            fx2.revertProps = fx.props.concat()
            var el = avalon.timeline[index]
            el.negative.push(fx2) //添加已存负向列队中
        }
    }

    function callback(fx, node, name) {
        if (fx[name]) {
            fx[name](node, fx)
        }
    }
    function enterFrame(fx, index) {
        //驱动主列队的动画实例进行补间动画(update)，
        //并在动画结束后，从子列队选取下一个动画实例取替自身
        var node = fx.node,
                now = +new Date
        if (!fx.startTime) { //第一帧
            callback(fx, node, "before") //动画开始前做些预操作
            fx.props && parseFrames(fx.node, fx, index) //parse原始材料为关键帧
            fx.props = fx.props || []
            AnimationPreproccess[fx.method || "noop"](node, fx) //parse后也要做些预处理
            fx.startTime = now
        } else { //中间自动生成的补间
            var per = (now - fx.startTime) / fx.duration
            var end = fx.gotoEnd || per >= 1 //gotoEnd可以被外面的stop方法操控,强制中止
            var hooks = effect.updateHooks
            if (fx.update) {
                for (var i = 0, obj; obj = fx.props[i++]; ) { // 处理渐变
                    (hooks[obj.type] || hooks._default)(node, per, end, obj)
                }
            }
            if (end) { //最后一帧
                callback(fx, node, "after") //动画结束后执行的一些收尾工作
                callback(fx, node, "complete") //执行用户回调
                if (fx.revert && fx.negative.length) { //如果设置了倒带
                    Array.prototype.unshift.apply(fx.positive, fx.negative.reverse())
                    fx.negative = [] // 清空负向列队
                }
                var neo = fx.positive.shift()
                if (!neo) {
                    return false
                } //如果存在排队的动画,让它继续
                timeline[index] = neo
                neo.positive = fx.positive
                neo.negative = fx.negative
            } else {
                callback(fx, node, "step") //每执行一帧调用的回调
            }
        }
        return true
    }
    avalon.fn.mix({
        delay: function(ms) {
            return this.fx(ms)
        },
        pause: function() {
            var node = this[0]
            for (var i = 0, fx; fx = timeline[i]; i++) {
                if (fx.node === node) {
                    fx.paused = new Date - 0
                }
            }
            return this
        },
        resume: function() {
            var now = new Date
            var node = this[0]
            for (var i = 0, fx; fx = timeline[i]; i++) {
                if (fx.node === node) {
                    fx.startTime += (now - fx.paused)
                    delete fx.paused
                }
            }
            return this
        },
        //如果clearQueue为true，是否清空列队
        //如果gotoEnd 为true，是否跳到此动画最后一帧
        stop: function(clearQueue, gotoEnd) {
            clearQueue = clearQueue ? "1" : ""
            gotoEnd = gotoEnd ? "1" : "0"
            var stopCode = parseInt(clearQueue + gotoEnd, 2) //返回0 1 2 3
            var node = this[0]
            for (var i = 0, fx; fx = timeline[i]; i++) {
                if (fx.node === node) {
                    fx.gotoEnd = true
                    switch (stopCode) { //如果此时调用了stop方法
                        case 0:
                            //中断当前动画，继续下一个动画
                            fx.update = false
                            fx.revert && fx.negative.shift()
                            break
                        case 1:
                            //立即跳到最后一帧，继续下一个动画
                            fx.revert && fx.negative.shift()
                            break
                        case 2:
                            //清空该元素的所有动画
                            delete fx.node
                            break
                        case 3:
                            //立即完成该元素的所有动画
                            fx.positive.forEach(function(a) {
                                a.gotoEnd = true
                            })
                            fx.negative.forEach(function(a) {
                                a.gotoEnd = true
                            })
                            break
                    }
                }
            }
            return this
        }
    })

    var fxAttrs = [
        ["height", "marginTop", "marginBottom", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"],
        ["width", "marginLeft", "marginRight", "borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"],
        ["opacity"]
    ]

    function genFx(type, num) { //生成属性包
        var obj = {}
        fxAttrs.concat.apply([], fxAttrs.slice(0, num)).forEach(function(name) {
            obj[name] = type
            if (~name.indexOf("margin")) {
                effect.updateHooks[name] = function(node, per, end, obj) {
                    var val = (end ? obj.to : obj.from + obj.easing(per) * (obj.to - obj.from))
                    node.style[name] = Math.max(val, 0) + obj.unit
                }
            }
        })
        return obj
    }


    var effects = {
        slideDown: genFx("show", 1),
        slideUp: genFx("hide", 1),
        slideToggle: genFx("toggle", 1),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }

    avalon.each(effects, function(method, props) {
        avalon.fn[method] = function() {
            var args = [].concat.apply([props], arguments)
            return this.fx.apply(this, args)
        }
    });

    "toggle, show,hide".replace(avalon.rword, function(name) {
        var pre = avalon.fn[name]
        avalon.fn[name] = function(a) {
            if (!arguments.length || typeof a === "boolean") {
                return pre && pre.apply(this, arguments)
            } else {
                var args = [].concat.apply([genFx(name, 3)], arguments)
                return this.fx.apply(this, args)
            }
        }
    })

    //=======================转换各种颜色值为RGB数组===========================
    var colorMap = {
        "black": [0, 0, 0],
        "gray": [128, 128, 128],
        "white": [255, 255, 255],
        "orange": [255, 165, 0],
        "red": [255, 0, 0],
        "green": [0, 128, 0],
        "yellow": [255, 255, 0],
        "blue": [0, 0, 255]
    }
    if (window.VBArray) {
        var parseColor = new function() {
            var trim = /^\s+|\s+$/g;
            var bod;
            try {
                var docum = new ActiveXObject("htmlfile")
                docum.write("<body>")
                docum.close()
                bod = docum.body
            } catch (e) {
                bod = createPopup().document.body
            }
            var range = bod.createTextRange()
            return function(color) {
                bod.style.color = String(color).replace(trim, "")
                var value = range.queryCommandValue("ForeColor")
                return [value & 0xff, (value & 0xff00) >> 8, (value & 0xff0000) >> 16]
            }
        }
    }

    function color2array(val) { //将字符串变成数组
        var color = val.toLowerCase(),
                ret = []
        if (colorMap[color]) {
            return colorMap[color]
        }
        if (color.indexOf("rgb") === 0) {
            var match = color.match(/(\d+%?)/g),
                    factor = match[0].indexOf("%") !== -1 ? 2.55 : 1
            return (colorMap[color] = [parseInt(match[0]) * factor, parseInt(match[1]) * factor, parseInt(match[2]) * factor])
        } else if (color.charAt(0) === '#') {
            if (color.length === 4)
                color = color.replace(/([^#])/g, '$1$1')
            color.replace(/\w{2}/g, function(a) {
                ret.push(parseInt(a, 16))
            })
            return (colorMap[color] = ret)
        }
        if (window.VBArray) {
            return (colorMap[color] = parseColor(color))
        }
        return colorMap.white
    }
    avalon.parseColor = color2array
    return avalon
})