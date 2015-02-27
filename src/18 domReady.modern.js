/*********************************************************************
 *                    DOMReady                                         *
 **********************************************************************/
var readyList = [], isReady
function fireReady() {
    if (!isReady) {
        isReady = true
        if (innerRequire) {
            modules["domReady!"].state = 4
            innerRequire.checkDeps()//隋性函数，防止IE9二次调用_checkDeps
        }
        readyList.forEach(function(a) {
            a(avalon)
        })
    }
}

if (DOC.readyState === "complete") {
    setTimeout(fireReady) //如果在domReady之外加载
} else {
    DOC.addEventListener("DOMContentLoaded", fireReady)
}
window.addEventListener("load", fireReady)
avalon.ready = function(fn) {
    if (!isReady) {
        readyList.push(fn)
    } else {
        fn(avalon)
    }
}
avalon.config({
    loader: true
})
avalon.ready(function() {
    avalon.scan(DOC.body)
})