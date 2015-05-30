/*********************************************************************
 *                    DOMReady                                         *
 **********************************************************************/
var readyList = [], isReady
var fireReady = function (fn) {
    isReady = true
    if (innerRequire) {
        modules["domReady!"].state = 4
        innerRequire.checkDeps()
    }
    while (fn = readyList.shift()) {
        fn(avalon)
    }
}


if (DOC.readyState === "complete") {
    setTimeout(fireReady) //如果在domReady之外加载
} else {
    DOC.addEventListener("DOMContentLoaded", fireReady)
}
window.addEventListener("load", fireReady)
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