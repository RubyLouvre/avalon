var window = global
var browser = {
    window: window,
    document: {//方便在nodejs环境不会报错
        createElement: function () {
            return {}
        },
        createElementNS: function(){
            return {}
        },
        contains: Boolean
    },
    root: {
        outerHTML: 'x'
    },
    msie: NaN,
    modern: true,
    avalonDiv: null,
    avalonFragment: null
}

if (window.window === window) {
    var document = window.document
    browser.document = document
    browser.modern = window.dispatchEvent
    browser.root = document.documentElement
    browser.avalonDiv = document.createElement('div')
    browser.avalonFragment = document.createDocumentFragment()
    if (window.VBArray) {
        browser.msie = document.documentMode || (window.XMLHttpRequest ? 7 : 6)
    }
}

browser.nextTick = (function () {// jshint ignore:line
    var tickImmediate = window.setImmediate
    var tickObserver = window.MutationObserver
    if (tickImmediate) {
        return tickImmediate.bind(window)
    }

    var queue = []
    function callback() {
        var n = queue.length
        for (var i = 0; i < n; i++) {
            queue[i]()
        }
        queue = queue.slice(n)
    }

    if (tickObserver) {
        var node = document.createTextNode('avalon')
        new tickObserver(callback).observe(node, {characterData: true})// jshint ignore:line
        var bool = false
        return function (fn) {
            queue.push(fn)
            bool = !bool
            node.data = bool
        }
    }
    return function (fn) {
        setTimeout(fn, 4)
    }
})()

module.exports = browser