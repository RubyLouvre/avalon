/*********************************************************************
 *                           DOMReady                               *
 **********************************************************************/

var readyList = []

function fireReady() {
    if (DOC.body) { //  在IE8 iframe中doScrollCheck可能不正确
        if (innerRequire) {
            modules["ready!"].state = 2
            innerRequire.checkDeps()
        } else {
            readyList.forEach(function(a) {
                a(avalon)
            })
        }
        fireReady = noop //隋性函数，防止IE9二次调用_checkDeps
    }
}

function doScrollCheck() {
    try { //IE下通过doScrollCheck检测DOM树是否建完
        root.doScroll("left")
        fireReady()
    } catch (e) {
        setTimeout(doScrollCheck)
    }
}

if (DOC.readyState === "complete") {
    setTimeout(fireReady) //如果在domReady之外加载
} else if (W3C) {
    DOC.addEventListener("DOMContentLoaded", fireReady)
} else {
    DOC.attachEvent("onreadystatechange", function() {
        if (DOC.readyState === "complete") {
            fireReady()
        }
    })
    var isFrame;
    try{
        isFrame=window.frameElement!=null//当前页面处于iframe中时,访问frameElement会抛出不允许跨域访问异常
    }
    catch(e){
        isFrame=true
    }
    if (root.doScroll&& !isFrame) {//只有不处于iframe时才用doScroll判断,否则可能会不准
        doScrollCheck()
    }
}
avalon.bind(window, "load", fireReady)

avalon.ready = function(fn) {
    if (innerRequire) {
        innerRequire(["ready!"], fn)
    } else if (fireReady === noop) {
        fn(avalon)
    } else {
        readyList.push(fn)
    }
}

avalon.config({
    loader: true
})

avalon.ready(function() {
    avalon.scan(DOC.body)
})