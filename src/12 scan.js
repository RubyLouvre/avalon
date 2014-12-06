/*********************************************************************
 *                           扫描系统                                 *
 **********************************************************************/
var scanObject = {}
avalon.scanCallback = function(fn, group) {
    group = group || "$all"
    var array = scanObject[group] || (scanObject[group] = [])
    array.push(fn)
}
avalon.scan = function(elem, vmodel, group) {
    elem = elem || root
    group = group || "$all"
    var array = scanObject[group] || []
    var vmodels = vmodel ? [].concat(vmodel) : []
    var scanIndex = 0;
    var scanAll = false
    var fn
    var dirty = false
    function cb(i) {
        scanIndex += i
        dirty = true
        setTimeout(function() {
            if (scanIndex <= 0 && !scanAll) {
                scanAll = true
                while (fn = array.shift()) {
                    fn()
                }
            }
        })
    }
    vmodels.cb = cb
    scanTag(elem, vmodels)
    //html, include, widget
    if (!dirty) {
        while (fn = array.shift()) {
            fn()
        }
    }
}

//http://www.w3.org/TR/html5/syntax.html#void-elements
var stopScan = oneObject("area,base,basefont,br,col,command,embed,hr,img,input,link,meta,param,source,track,wbr,noscript,script,style,textarea".toUpperCase())

function checkScan(elem, callback, innerHTML) {
    var id = setTimeout(function() {
        var currHTML = elem.innerHTML
        clearTimeout(id)
        if (currHTML === innerHTML) {
            callback()
        } else {
            checkScan(elem, callback, currHTML)
        }
    })
}


function createSignalTower(elem, vmodel) {
    var id = elem.getAttribute("avalonctrl") || vmodel.$id
    elem.setAttribute("avalonctrl", id)
    vmodel.$events.expr = elem.tagName + '[avalonctrl="' + id + '"]'
}

var getBindingCallback = function(elem, name, vmodels) {
    var callback = elem.getAttribute(name)
    if (callback) {
        for (var i = 0, vm; vm = vmodels[i++]; ) {
            if (vm.hasOwnProperty(callback) && typeof vm[callback] === "function") {
                return vm[callback]
            }
        }
    }
}

function executeBindings(bindings, vmodels) {
    if (bindings.length)
        vmodels.cb(bindings.length)

    for (var i = 0, data; data = bindings[i++]; ) {
        data.vmodels = vmodels
        bindingHandlers[data.type](data, vmodels)
        if (data.evaluator && data.element && data.element.nodeType === 1) { //移除数据绑定，防止被二次解析
            //chrome使用removeAttributeNode移除不存在的特性节点时会报错 https://github.com/RubyLouvre/avalon/issues/99
            data.element.removeAttribute(data.name)
        }
    }
    bindings.length = 0
}


var rmsAttr = /ms-(\w+)-?(.*)/
var priorityMap = {
    "if": 10,
    "repeat": 90,
    "data": 100,
    "widget": 110,
    "each": 1400,
    "with": 1500,
    "duplex": 2000,
    "on": 3000
}
var events = oneObject("animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit")

function bindingSorter(a, b) {
    return a.priority - b.priority
}
var obsoleteAttrs = oneObject("value,title,alt,checked,selected,disabled,readonly,enabled")