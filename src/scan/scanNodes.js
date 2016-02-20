
var rexpr = avalon.config.rexpr
var scanText = require("./scanText")
var scanTag = require("./scanTag")

//更新整个虚拟DOM树
function scanNodes(nodes, vm) {
    for (var i = 0, n = nodes.length; i < n; i++) {
        var node = nodes[i]

        switch (node.type) {
            case "#comment":
            case "#component":
                break
            case "#text":
                if (!node.skipContent) {
                    if (rexpr.test(String(node.nodeValue))) {
                        vm && scanText(node, vm)
                    }
                }
                break
            default:
                vm = scanTag(node, vm, nodes)
                if (!node.disposed) {//ms-repeat会销毁原来的节点
                    scanNodes(node.children, vm)
                }
                break
        }

    }
    return nodes
}
module.exports = scanNodes