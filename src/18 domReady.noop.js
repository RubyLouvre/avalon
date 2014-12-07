/*********************************************************************
 *                     END                                  *
 **********************************************************************/
avalon.ready = noop
if (W3C) {
    DOC.addEventListener("DOMContentLoaded", function() {
        avalon.scan(DOC.body)
    })
} else {
    avalon.bind(window, "load", function() {
        avalon.scan(DOC.body)
    })
}
avalon.config({
    loader: false
})