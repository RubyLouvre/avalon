import { avalon, window, document, root, inBrowser } from '../../seed/core'

var readyList = []

export function fireReady(fn) {
    avalon.isReady = true
    while (fn = readyList.shift()) {
        fn(avalon)
    }
}

avalon.ready = function (fn) {
    readyList.push(fn)
    if (avalon.isReady) {
        fireReady()
    }
}

avalon.ready(function () {
   avalon.scan && avalon.scan(document.body)
})

/* istanbul ignore next */
function bootstrap() {
    function doScrollCheck() {
        try { //IE下通过doScrollCheck检测DOM树是否建完
            root.doScroll('left')
            fireReady()
        } catch (e) {
            setTimeout(doScrollCheck)
        }
    }
    if (document.readyState === 'complete') {
        setTimeout(fireReady) //如果在domReady之外加载
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fireReady,false)
    } else if (document.attachEvent) {
        //必须传入三个参数，否则在firefox4-26中报错
        //caught exception: [Exception... "Not enough arguments"  nsresult: "0x
        document.attachEvent('onreadystatechange', function () {
            if (document.readyState === 'complete') {
                fireReady()
            }
        })
        try {
            var isTop = window.frameElement === null
        } catch (e) {
        }
        if (root.doScroll && isTop && window.external) {//fix IE iframe BUG
            doScrollCheck()
        }
    }

    avalon.bind(window, 'load', fireReady)
}
if (inBrowser) {
    bootstrap()
}


