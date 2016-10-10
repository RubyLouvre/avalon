import {avalon} from './core'
var _window = Function(' return this')() || this
var browser = {
    _window: _window,
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
_window.avalon = avalon
/* istanbul ignore if  */
if (_window.location && _window.navigator && _window.window) {
    var DOC = _window.document
    browser.inBrowser = true
    browser.document = DOC
    browser.root = DOC.documentElement
    browser.avalonDiv = DOC.createElement('div')
    browser.avalonFragment = DOC.createDocumentFragment()
    if (_window.VBArray) {
        browser.msie = DOC.documentMode || (_window.XMLHttpRequest ? 7 : 6)
        browser.modern = browser.msie > 8
    } else {
        browser.modern = true
    }
}

avalon.shadowCopy(avalon, browser)


