/*********************************************************************
 *                           DOMReady                                *
 **********************************************************************/

var readyList = [],
    isReady
var fireReady = function (fn) {
    isReady = true
    var require = avalon.require
    if (require && require.checkDeps) {
        modules["domReady!"].state = 4
        require.checkDeps()
    }
    while (fn = readyList.shift()) {
        fn(avalon)
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
    DOC.attachEvent("onreadystatechange", function () {
        if (DOC.readyState === "complete") {
            fireReady()
        }
    })
    try {
        var isTop = window.frameElement === null
    } catch (e) {}
    if (root.doScroll && isTop && window.external) { //fix IE iframe BUG
        doScrollCheck()
    }
}
avalon.bind(window, "load", fireReady)

avalon.ready = function (fn) {
    if (!isReady) {
        readyList.push(fn)
    } else {
        fn(avalon)
    }
}

avalon.config({
    loader: true
})
avalon.ready(function () {
    avalon.scan(DOC.body)
})
