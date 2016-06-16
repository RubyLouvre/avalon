var Recognizer = require('./recognizer')
var root = avalon.root
var supportPointer = !!navigator.pointerEnabled || !!navigator.msPointerEnabled
// 支持pointer的设备可用样式来取消click事件的300毫秒延迟
if (supportPointer) { 
  root.style.msTouchAction = root.style.touchAction = 'none'
}
var tapRecognizer = {
  events: ['tap'],
  touchBoundary: 10,
  tapDelay: 200,
  needClick: function(target) {
    //判定是否使用原生的点击事件, 否则使用sendClick方法手动触发一个人工的点击事件
    switch (target.nodeName.toLowerCase()) {
      case 'button':
      case 'select':
      case 'textarea':
        if (target.disabled) {
          return true
        }

        break;
      case 'input':
        // IOS6 pad 上选择文件，如果不是原生的click，弹出的选择界面尺寸错误
        if ((Recognizer.isIOS && target.type === 'file') || target.disabled) {
          return true
        }

        break;
      case 'label':
      case 'iframe':
      case 'video':
        return true
    }

    return false
  },
  needFocus: function(target) {
    switch (target.nodeName.toLowerCase()) {
      case 'textarea':
      case 'select': //实测android下select也需要
        return true;
      case 'input':
        switch (target.type) {
          case 'button':
          case 'checkbox':
          case 'file':
          case 'image':
          case 'radio':
          case 'submit':
            return false
        }
        //如果是只读或disabled状态,就无须获得焦点了
        return !target.disabled && !target.readOnly
      default:
        return false
    }
  },
  focus: function(targetElement) {
    var length;
    //在iOS7下, 对一些新表单元素(如date, datetime, time, month)调用focus方法会抛错,
    //幸好的是,我们可以改用setSelectionRange获取焦点, 将光标挪到文字的最后
    var type = targetElement.type
    if (Recognizer.isIOS && targetElement.setSelectionRange &&
      type.indexOf('date') !== 0 && type !== 'time' && type !== 'month') {
      length = targetElement.value.length
      targetElement.setSelectionRange(length, length)
    } else {
      targetElement.focus()
    }
  },
  findControl: function(labelElement) {
    // 获取label元素所对应的表单元素
    // 可以能过control属性, getElementById, 或用querySelector直接找其内部第一表单元素实现
    if (labelElement.control !== undefined) {
      return labelElement.control
    }

    if (labelElement.htmlFor) {
      return document.getElementById(labelElement.htmlFor)
    }

    return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea')
  },
  fixTarget: function(target) {
    if (target.nodeType === 3) {
      return target.parentNode
    }
    if (window.SVGElementInstance && (target instanceof SVGElementInstance)) {
      return target.correspondingUseElement;
    }

    return target
  },
  updateScrollParent: function(targetElement) {
    //如果事件源元素位于某一个有滚动条的祖父元素中,那么保持其scrollParent与scrollTop值
    var scrollParent = targetElement.tapScrollParent

    if (!scrollParent || !scrollParent.contains(targetElement)) {
      var parentElement = targetElement
      do {
        if (parentElement.scrollHeight > parentElement.offsetHeight) {
          scrollParent = parentElement
          targetElement.tapScrollParent = parentElement
          break
        }

        parentElement = parentElement.parentElement
      } while (parentElement)
    }

    if (scrollParent) {
      scrollParent.lastScrollTop = scrollParent.scrollTop
    }
  },
  touchHasMoved: function(event) {
    //判定是否发生移动,其阀值是10px
    var touch = event.changedTouches[0],
      boundary = tapRecognizer.touchBoundary
    return Math.abs(touch.pageX - tapRecognizer.pageX) > boundary ||
      Math.abs(touch.pageY - tapRecognizer.pageY) > boundary

  },

  findType: function(targetElement) {
    // 安卓chrome浏览器上，模拟的 click 事件不能让 select 打开，故使用 mousedown 事件
    return Recognizer.isAndroid && targetElement.tagName.toLowerCase() === 'select' ?
      'mousedown' : 'click'
  },
  sendClick: function(targetElement, event) {
    // 在click之前触发tap事件
    Recognizer.fire(targetElement, 'tap', {
      touchEvent: event
    })
    var clickEvent, touch
      //某些安卓设备必须先移除焦点，之后模拟的click事件才能让新元素获取焦点
    if (document.activeElement && document.activeElement !== targetElement) {
        document.activeElement.blur()
    }

    touch = event.changedTouches[0]
      // 手动触发点击事件,此时必须使用document.createEvent('MouseEvents')来创建事件
      // 及使用initMouseEvent来初始化它
    clickEvent = document.createEvent('MouseEvents')
    clickEvent.initMouseEvent(tapRecognizer.findType(targetElement), true, true,
    window, 1, touch.screenX,touch.screenY, touch.clientX, touch.clientY, 
    false, false, false, false, 0, null)
    clickEvent.touchEvent = event
    targetElement.dispatchEvent(clickEvent)
  },
  touchstart: function(event) {
    //忽略多点触摸
    if (event.targetTouches.length !== 1) {
      return true
    }
    //修正事件源对象
    var targetElement = tapRecognizer.fixTarget(event.target)
    var touch = event.targetTouches[0]
    if (Recognizer.isIOS) {
      // 判断是否是点击文字，进行选择等操作，如果是，不需要模拟click
      var selection = window.getSelection();
      if (selection.rangeCount && !selection.isCollapsed) {
        return true
      }
      var id = touch.identifier
        //当 alert 或 confirm 时，点击其他地方，会触发touch事件，identifier相同，此事件应该被忽略
      if (id && isFinite(tapRecognizer.lastTouchIdentifier) && tapRecognizer.lastTouchIdentifier === id) {
        event.preventDefault()
        return false
      }

      tapRecognizer.lastTouchIdentifier = id

      tapRecognizer.updateScrollParent(targetElement)
    }
    //收集触摸点的信息
    tapRecognizer.status = "tapping"
    tapRecognizer.startTime = Date.now()
    tapRecognizer.element = targetElement
    tapRecognizer.pageX = touch.pageX
    tapRecognizer.pageY = touch.pageY
      // 如果点击太快,阻止双击带来的放大收缩行为
    if ((tapRecognizer.startTime - tapRecognizer.lastTime) < tapRecognizer.tapDelay) {
      event.preventDefault()
    }
  },
  touchmove: function(event) {
    if (tapRecognizer.status !== "tapping") {
      return true
    }
    // 如果事件源元素发生改变,或者发生了移动,那么就取消触发点击事件
    if (tapRecognizer.element !== tapRecognizer.fixTarget(event.target) ||
      tapRecognizer.touchHasMoved(event)) {
      tapRecognizer.status = tapRecognizer.element = 0
    }

  },
  touchend: function(event) {
    var targetElement = tapRecognizer.element
    var now = Date.now()
      //如果是touchstart与touchend相隔太久,可以认为是长按,那么就直接返回
      //或者是在touchstart, touchmove阶段,判定其不该触发点击事件,也直接返回
    if (!targetElement || now - tapRecognizer.startTime > tapRecognizer.tapDelay) {
      return true
    }

    tapRecognizer.lastTime = now

    var startTime = tapRecognizer.startTime
    tapRecognizer.status = tapRecognizer.startTime = 0

    targetTagName = targetElement.tagName.toLowerCase()
    if (targetTagName === 'label') {
      //尝试触发label上可能绑定的tap事件
      Recognizer.fire(targetElement, 'tap', {
        touchEvent: event
      })
      var forElement = tapRecognizer.findControl(targetElement)
      if (forElement) {
        tapRecognizer.focus(targetElement)
        targetElement = forElement
      }
    } else if (tapRecognizer.needFocus(targetElement)) {
      //  如果元素从touchstart到touchend经历时间过长,那么不应该触发点击事
      //  或者此元素是iframe中的input元素,那么它也无法获点焦点
      if ((now - startTime) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
        tapRecognizer.element = 0
        return false
      }

      tapRecognizer.focus(targetElement)
      Recognizer.isAndroid && tapRecognizer.sendClick(targetElement, event)

      return false
    }

    if (Recognizer.isIOS) {
      //如果它的父容器的滚动条发生改变,那么应该识别为划动或拖动事件,不应该触发点击事件
      var scrollParent = targetElement.tapScrollParent;
      if (scrollParent && scrollParent.lastScrollTop !== scrollParent.scrollTop) {
        return true
      }
    }
    //如果这不是一个需要使用原生click的元素，则屏蔽原生事件，避免触发两次click
    if (!tapRecognizer.needClick(targetElement)) {
      event.preventDefault()
        // 触发一次模拟的click
      tapRecognizer.sendClick(targetElement, event)
    }
  },
  touchcancel: function() {
    tapRecognizer.startTime = tapRecognizer.element = 0
  }
}

Recognizer.add('tap', tapRecognizer)
