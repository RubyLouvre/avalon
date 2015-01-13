/*********************************************************************
 *                     END                                  *
 **********************************************************************/
new function() {
    avalon.config({
        loader: false
    })
    var fns = [], listener,
            hack = root.doScroll,
            domContentLoaded = "DOMContentLoaded",
            loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(DOC.readyState)
    if (!loaded) {
        DOC.addEventListener(domContentLoaded, listener = function() {
            DOC.removeEventListener(domContentLoaded, listener)
            loaded = 1
            while (listener = fns.shift())
                listener()
        })
    }
    avalon.ready = function(fn) {
        loaded ? fn() : fns.push(fn)
    }
    avalon.ready(function() {
        avalon.scan(DOC.body)
    })
}
