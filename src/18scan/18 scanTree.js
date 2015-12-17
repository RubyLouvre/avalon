function scanTree(nodes, vm) {
    for (var i = 0, n = nodes.length; i < n; i++) {
        var node = nodes[i]
        switch (node.type) {
            case "#comment":
                break
            case "#text":
                if (!node.skip) {
                    if (rexpr.test(String(node.nodeValue))) {
                        var arr = scanText(node, vm)
                        if (arr.length > 1) {
                            nodes.splice.apply(nodes, [i, 1].concat(arr))
                            i = i + arr.length
                        }
                    }
                }
                break
            case "#component":
                if (!node.skip) {
                    node.update(vm)
                }
                break
            default:
                if (!node.skip) {
                    nodes[i] = scanTag(node, vm)
                }
                break
        }
    }
    return nodes
}

directives["{{}}"] = {
    init: function (text, vm) {
    },
    update: function (value, binding) {
        binding.array[binding.index] = value
        var nodeValue = binding.array.join("")
        var node = binding.element
        if (nodeValue !== node.nodeValue) {
            node.change = "update"
            node.nodeValue = nodeValue
        }
    }
}