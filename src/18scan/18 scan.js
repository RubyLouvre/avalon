/*********************************************************************
 *                           扫描系统                                 *
 **********************************************************************/

avalon.scan = function (elem, vmodel) {
    var text = elem.outerHTML
    if (rbind.test(text)) {
        var tree = createVirtual(text, vmodel)
        updateVirtual(tree, vmodel)
        updateEntity([elem], tree)
    }
}


function addHooks(elem, name) {
    return elem[name] || (elem[name] = {})
}

function addAttrHook(node) {
    var hook = addHooks(node, "changeHooks")
    hook.attr = attrUpdate
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
