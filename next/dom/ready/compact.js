import './scan'

import avalon from '../../seed/core'
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

    function doScrollCheck() {
        try { //IE下通过doScrollCheck检测DOM树是否建完
            root.doScroll('left')
            fireReady()
        } catch (e) {
            setTimeout(doScrollCheck)
        }
    }

    if (doc.readyState === 'complete') {
        setTimeout(fireReady) //如果在domReady之外加载
    } else if (doc.addEventListener) {
        doc.addEventListener('DOMContentLoaded', fireReady)
    } else if (doc.attachEvent) {
        doc.attachEvent('onreadystatechange', function () {
            if (doc.readyState === 'complete') {
                fireReady()
            }
        })
        try {
            var isTop = win.frameElement === null
        } catch (e) {
        }
        if (root.doScroll && isTop && win.external) {//fix IE iframe BUG
            doScrollCheck()
        }
    }

    avalon.bind(win, 'load', fireReady)
}



