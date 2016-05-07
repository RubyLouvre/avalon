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
    avalonDiv: {},
    avalonFragment: null
}

if(window.location && window.navigator && window.window){
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


module.exports = browser