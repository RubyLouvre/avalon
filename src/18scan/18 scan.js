/*********************************************************************
 *                           扫描系统                                 *
 **********************************************************************/

avalon.scan = function (elem, vmodel) {
    var text = elem.outerHTML
    if (rbind.test(text)) {
        var tree = buildVTree(text, vmodel)
        scanTree(tree, vmodel)
        updateTree([elem], tree)
    }
}

function updateTree(nodes, vnodes) {
    for (var i = 0, n = nodes.length; i < n; i++) {
        var vnode = vnodes[i]
        if (!vnode)
            break
        var node = nodes[i]

        switch (vnode.type) {
            case "#text":
                if (!vnode.skip) {
                    if (vnode.change) {
                        node.nodeValue = vnode.nodeValue
                        delete vnode.change
                    }
                }
                break
            case "#component":
                var hooks = vnode.changeHooks
                if (hooks) {
                    try {
                        for (var hook in hooks) {
                            hooks[hook](node, vnode)
                        }
                    } catch (e) {
                        avalon.log(e, node, vnode)
                    }
                    delete vnode.changeHooks
                }
                updateTree(node.childNodes, vnode.children)
                break
            case "#comment":
                break
            default:
                if (!vnode.skip) {
                    hooks = vnode.changeHooks
                    try {
                        for (hook in hooks) {
                            hooks[hook](node, vnode)
                        }
                    } catch (e) {
                    }
                    delete vnode.changeHooks
                    if (!vnode.skipContent) {
                        updateTree(node.childNodes, vnode.children)
                    }
                }
                break
        }
    }
}

function addHooks(elem, name) {
    return elem[name] || (elem[name] = {})
}

function addAttrHook(node) {
    var hook = addHooks(node, "changeHooks")
    hook.attr = attrUpdate
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
