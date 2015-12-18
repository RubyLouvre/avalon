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
            case "#comment":
                if (!vnode.skip) {
                    // 添加或删除
                    // nodes[i].nodeValue = vnode.nodeValue
                    // delete vnode.change
                }
                break
            default:
                if (!vnode.skip) {
                    var hooks = vnode.changeHooks

                    for (var hook in hooks) {
                        hooks[hook](node, vnode)
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
