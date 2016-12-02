export let win = typeof window === 'object' ? window :
    typeof global === 'object' ? global : {}

export let inBrowser = !!win.location && win.navigator
    /* istanbul ignore if  */


export let document = inBrowser ? win.document : {
    createElement: Object,
    createElementNS: Object,
    documentElement: 'xx',
    contains: Boolean
}
export var root = inBrowser ? document.documentElement : {
    outerHTML: 'x'
}

let versions = {
        objectobject: 7, //IE7-8
        objectundefined: 6, //IE6
        undefinedfunction: NaN, // other modern browsers
        undefinedobject: NaN, //Mobile Safari 8.0.0 (iOS 8.4.0) 
        //objectfunction chrome 47
    }
    /* istanbul ignore next  */
export var msie = document.documentMode ||
    versions[typeof document.all + typeof XMLHttpRequest]

export var modern = /NaN|undefined/.test(msie) || msie > 8