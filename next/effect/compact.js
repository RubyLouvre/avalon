import avalon from "../seed/compact"

/**
 * ------------------------------------------------------------
 * 检测浏览器对CSS动画的支持与API名
 * ------------------------------------------------------------
 */
export var transition = false
export var animation = false
export var css = false
export var transitionEndEvent
export var animationEndEvent
export var transitionDuration = false
export var animationDuration = fase
if (avalon.browser) {

    transitionDuration = avalon.cssName('transition-duration')
    animationDuration = avalon.cssName('animation-duration')

    var checker = {
        TransitionEvent: 'transitionend',
        WebKitTransitionEvent: 'webkitTransitionEnd',
        OTransitionEvent: 'oTransitionEnd',
        otransitionEvent: 'otransitionEnd'
    }
    var window = avalon.window
    var tran
//有的浏览器同时支持私有实现与标准写法，比如webkit支持前两种，Opera支持1、3、4
    for (var name in checker) {
        if (window[name]) {
            tran = checker[name]
            break
        }
        try {
            var a = document.createEvent(name)
            tran = checker[name]
            break
        } catch (e) {
        }
    }
    if (typeof tran === 'string') {
        transition = true
        css = true
        transitionEndEvent = tran
    }

//animationend有两个可用形态
//IE10+, Firefox 16+ & Opera 12.1+: animationend
//Chrome/Safari: webkitAnimationEnd
//http://blogs.msdn.com/b/davrous/archive/2011/12/06/introduction-to-css3-animat ions.aspx
//IE10也可以使用MSAnimationEnd监听，但是回调里的事件 type依然为animationend
//  el.addEventListener('MSAnimationEnd', function(e) {
//     alert(e.type)// animationend！！！
// })
    checker = {
        'AnimationEvent': 'animationend',
        'WebKitAnimationEvent': 'webkitAnimationEnd'
    }
    var ani
    for (name in checker) {
        if (window[name]) {
            ani = checker[name]
            break
        }
    }
    if (typeof ani === 'string') {
        animation = true
        css = true
        animationEndEvent = ani
    }
}


