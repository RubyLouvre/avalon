var builtin = require("../base/builtin")

var document = builtin.document

var fns = [], loaded = document.readyState === "complete", fn
function flush(f) {
    loaded = 1
    while (f = fns.shift())
        f()
}



avalon.bind(document, "DOMContentLoaded", fn = function () {
    avalon.unbind(document, "DOMContentLoaded", fn)
    flush()
})

var id = setInterval(function () {
    if (document.readyState === "complete" && document.body) {
        clearInterval(id)
        flush()
    }
}, 50)

avalon.ready = function (fn) {
    loaded ? fn(avalon) : fns.push(fn)
}

avalon.ready(function () {
    avalon.scan(document.body)
})
