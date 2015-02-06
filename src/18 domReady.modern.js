/*********************************************************************
 *                    DOMReady                                         *
 **********************************************************************/
var readyList = []
function fireReady() {
    if (innerRequire) {
        modules["ready!"].state = 4
        innerRequire.checkDeps()//隋性函数，防止IE9二次调用_checkDeps
    }
    readyList.forEach(function(a) {
        a(avalon)
    })
    fireReady = noop //隋性函数，防止IE9二次调用_checkDeps
}

if (DOC.readyState === "complete") {
    setTimeout(fireReady) //如果在domReady之外加载
} else {
    DOC.addEventListener("DOMContentLoaded", fireReady)
    window.addEventListener("load", fireReady)
}
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