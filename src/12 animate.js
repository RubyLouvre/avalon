var animateQueue = []
var animate = {
    enter: function(elem) {
        var el = avalon(elem)
        el.bind(transitionName, function fn() {
            el.removeClass("ms-enter ms-enter-active")
            el.unbind(transitionName, fn)
        })

        el.addClass("ms-enter")
        setTimeout(function() {
            el.addClass("ms-enter-active")
        })
    },
    leave: function(elem, parent, after) {
        elem = elem.cloneNode(true)
        parent.insertBefore(elem, after)
        var el = avalon(elem)
        el.bind(transitionName, function fn() {
            el.removeClass("ms-leave ms-leave-active")
            el.unbind(transitionName, fn)
            parent.removeChild(elem)
        })
        el.addClass("ms-leave")
        setTimeout(function() {
            el.addClass("ms-leave-active")
        })
    }

}
var getTransitionEndEventName = function() {
    var obj = {
        'TransitionEvent': 'transitionend',
        'WebKitTransitionEvent': 'webkitTransitionEnd',
        'OTransitionEvent': 'oTransitionEnd',
        'otransitionEvent': 'otransitionEnd'
    }
    var ret
    //有的浏览器同时支持私有实现与标准写法，比如webkit支持前两种，Opera支持1、3、4
    for (var name in obj) {
        if (window[name]) {
            ret = obj[name]
            break;
        }
        try {
            var a = document.createEvent(name);
            ret = obj[name]
            break;
        } catch (e) {}
    } //这是一个惰性函数，只检测一次，下次直接返回缓存结果
    getTransitionEndEventName = function() {
        return ret
    }
    return ret
}
var transitionName = getTransitionEndEventName()