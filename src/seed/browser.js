var avalon = require('./core')
var window = Function(' return this')() || this
var browser = {
    window: window,
    document: {//方便在nodejs环境不会报错
        createElement: Object,
        createElementNS: Object,
        contains: Boolean
    },
    root: {
        outerHTML: 'x'
    },
    msie: NaN,
    browser: false,
    modern: true,
    avalonDiv: {},
    avalonFragment: null
}
window.avalon = avalon
/* istanbul ignore if  */
if (window.location && window.navigator && window.window) {
    var doc = window.document
    browser.browser = true
    browser.document = doc
    browser.root = doc.documentElement
    browser.avalonDiv = doc.createElement('div')
    browser.avalonFragment = doc.createDocumentFragment()
    if (window.VBArray) {
        browser.msie = doc.documentMode || (window.XMLHttpRequest ? 7 : 6)
        browser.modern = browser.msie > 8
    } else {
        browser.modern = true
    }
}

avalon.shadowCopy(avalon, browser)


