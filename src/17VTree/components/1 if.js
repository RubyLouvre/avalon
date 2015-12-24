avalon.components = {}


avalon.directive("if", {
    init: function (binding) {
        var element = binding.element
        var templale = toString(element, {
            "ms-if": true,
            "avalon-uuid": true
        })

        var component = new VComponent("ms-if")
        component.template = templale
        var arr = binding.siblings
        for (var i = 0, el; el = arr[i]; i++) {
            if (el === element) {
                arr[i] = component
                break
            }
        }
        delete binding.siblings
        binding.element = component
        return false
    },
    is: function (a, b) {
        if (b === void 0)
            return false
        return Boolean(a) === Boolean(b)
    },
    change: function (value, binding) {
        var elem = binding.element
        if (elem) {
            disposeVirtual(elem.children)
            elem.state = !!value
            if (value) {
                var vnodes = createVirtual(elem.template, true)
                updateVirtual(vnodes, binding.vmodel)
                pushArray(elem.children, vnodes)
            } else {
                pushArray(elem.children, [new VComment("ms-if")])
            }

            addHooks(this, binding)
        }
    },
    update: function (node, vnode, parent) {
        var dom = node, vdom = vnode.children[0]
        if (node.nodeType !== getVType(vdom)) {
            if (!node.keep) {//保存之前节点的引用,减少反复创建真实DOM
                avalon.log(new Date() - 0)
                var c = vdom.toDOM()
                c.keep = node
                node.keep = c
            }
            parent.replaceChild(node.keep, node)
            dom = node.keep
        }
        if (dom.nodeType === 1) {
            updateEntity([dom], [vdom], parent)
        }
        return false
    }
})

function toString(element, map) {
    var p = []
    for (var i in element.props) {
        if (map[i])
            continue
        p.push(i + "=" + quote(String(element.props[i])))
    }
    p = p.length ? " " + p.join(" ") : ""

    var str = "<" + element.type + p
    if (element.selfClose) {
        return str + "/>"
    }
    str += ">"

    str += element.template

    return str + "</" + element.type + ">"
}

//            if (first.type === "#comment" && first.nodeValue.indexOf(":start") > 0) {
//                //抽取需要处理的节点
//                if (node.nodeType === 8 && node.nodeValue === first.nodeValue) {
//                    var breakText = first.nodeValue.replace(":start", ":end")
//                    var insertPoint = null, next = node
//
//                    while (next = next.sibling) {
//                        nodes.push(next)
//                        if (next.nodeValue === breakText) {
//                            insertPoint = next.sibling
//                            break
//                        }
//                    }
//                  //  f.insertBefore(node, f.firstChild)
//                    flag = true
//                }
//            }
