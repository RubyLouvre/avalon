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
    if (document.readyState === 'complete') {
        setTimeout(fireReady) //如果在domReady之外加载
    } else {
        document.addEventListener('DOMContentLoaded', fireReady)
    }

    avalon.bind(window, 'load', fireReady)
}


if (inBrowser) {
    bootstrap()
}



