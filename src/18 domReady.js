/*********************************************************************
 *                           DOMReady                               *
 **********************************************************************/

var readyList = []
function fireReady() {
    if (DOC.body) { //  在IE8 iframe中doScrollCheck可能不正确
        if (innerRequire) {
            modules["domReady!"].state = 4
            innerRequire.checkDeps()
        }
        readyList.forEach(function(a) {
            a(avalon)
        })
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
    try {
        var isTop = window.frameElement === null
    } catch (e) {
    }
    if (root.doScroll && isTop && window.external) {//只有不处于iframe时才用doScroll判断,否则可能会不准
        doScrollCheck()
    }
}
avalon.bind(window, "load", fireReady)

avalon.ready = function(fn) {
    if (fireReady === noop) {
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