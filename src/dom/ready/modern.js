import { avalon, window, document, root, inBrowser } from '../../seed/core'

var readyList = []

export function fireReady(fn) {
    avalon.isReady = true
    while (fn = readyList.shift()) {
        fn(avalon)
    }
}

avalon.ready = function(fn) {
    readyList.push(fn)
    if (avalon.isReady) {
        fireReady()
    }
}

avalon.ready(function() {
    avalon.scan && avalon.scan(document.body)
})

/* istanbul ignore next */
function bootstrap() {
    if (document.readyState === 'complete') {
        setTimeout(fireReady) //如果在domReady之外加载
    } else {
        //必须传入三个参数，否则在firefox4-26中报错
        //caught exception: [Exception... "Not enough arguments"  nsresult: "0x80570001 (NS_ERROR_XPC_NOT_ENOUGH_ARGS)" 
        document.addEventListener('DOMContentLoaded', fireReady, false)
    }

    avalon.bind(window, 'load', fireReady)
}


if (inBrowser) {
    bootstrap()
}