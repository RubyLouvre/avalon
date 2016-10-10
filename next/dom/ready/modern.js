import './scan'
import {avalon} from '../../seed/core'
import {win, doc,root} from '../../seed/lang.share'


var readyList = [], isReady
var fireReady = function (fn) {
    isReady = true

    while (fn = readyList.shift()) {
        fn(avalon)
    }
}

avalon.ready = function (fn) {
    if (!isReady) {
        readyList.push(fn)
    } else {
        fn(avalon)
    }
}

avalon.ready(function () {
    avalon.scan(doc.body)
})

new function () {
    if (!avalon.inBrowser)
        return
    if (doc.readyState === 'complete') {
        setTimeout(fireReady) //如果在domReady之外加载
    } else {
        doc.addEventListener('DOMContentLoaded', fireReady)
    }

    avalon.bind(win, 'load', fireReady)

}


