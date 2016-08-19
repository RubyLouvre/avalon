var avalon = require('./core')
var window = Function(' return this')() || this
var browser = {
    window: window,
    document: {//方便在nodejs环境不会报错
        createElement: function () {
            return {}
        },
        createElementNS: function () {
            return {}
        },
        contains: Boolean
    },
    root: {
        outerHTML: 'x'
    },
    msie: NaN,
    modern: true,
    avalonDiv: {},
    avalonFragment: null
}
window.avalon = avalon

if (window.location && window.navigator && window.window) {
    var doc = window.document
    browser.browser = true
    browser.document = doc
    browser.modern = window.dispatchEvent
    browser.root = doc.documentElement
    browser.avalonDiv = doc.createElement('div')
    browser.avalonFragment = doc.createDocumentFragment()
    if (window.VBArray) {
        browser.msie = doc.documentMode || (window.XMLHttpRequest ? 7 : 6)
    }
}

avalon.shadowCopy(avalon, browser)


