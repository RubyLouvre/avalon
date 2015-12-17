/*********************************************************************
 *                           扫描系统                                 *
 **********************************************************************/
avalon.scan = function (elem, vmodel) {
    var text = elem.outerHTML
    if(rbind.test(text)){
        var tree = buildVTree(text, vmodel)
        scanTree(tree, vmodel)
        console.log(tree)
    }
}












var getBindingCallback = function (elem, name, vmodels) {
    var callback = elem.getAttribute(name)
    if (callback) {
        for (var i = 0, vm; vm = vmodels[i++]; ) {
            if (vm.hasOwnProperty(callback) && typeof vm[callback] === "function") {
                return vm[callback]
            }
        }
    }
}





var rnoCollect = /^(ms-\S+|data-\S+|on[a-z]+|id|style|class)$/
var ronattr = /^on\-[\w-]+$/
function getOptionsFromTag(elem, vmodels) {
    var attributes = elem.attributes
    var ret = {}
    for (var i = 0, attr; attr = attributes[i++]; ) {
        var name = attr.name
        if (attr.specified && !rnoCollect.test(name)) {
            var camelizeName = camelize(attr.name)
            if (/^on\-[\w-]+$/.test(name)) {
                ret[camelizeName] = getBindingCallback(elem, name, vmodels) 
            } else {
                ret[camelizeName] = parseData(attr.value)
            }
        }

    }
    return ret
}
