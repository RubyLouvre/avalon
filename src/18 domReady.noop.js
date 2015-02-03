/*********************************************************************
 *                     END                                  *
 **********************************************************************/
new function() {
    avalon.config({
        loader: false
    })
    var fns = [], fn, loaded
    function flush(f) {
        loaded = 1
        while (f = fns.shift())
            f()
    }
    if (W3C) {
        avalon.bind(DOC, "DOMContentLoaded", fn = function() {
            avalon.unbind(DOC, "DOMContentLoaded", fn)
            flush()
        })
    } else {
        var id = setInterval(function() {
            if (document.readyState === "complete" && document.body) {
                clearInterval(id)
                flush()
            }
        }, 50)
    }
    avalon.ready = function(fn) {
        loaded ? fn(avalon) : fns.push(fn)
    }
    avalon.ready(function() {
        avalon.scan(DOC.body)
    })
}
