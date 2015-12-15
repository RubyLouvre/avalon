function scanTree(arr, vm) {
    arr.forEach(function (node, index) {
        switch (node.type) {
            case "#comment":
                break
            case "#text":
                if (!node.skip) {
                    var nodeValue = parseText(String(node.nodeValue), vm)
                    if (nodeValue !== node.nodeValue) {
                        node.change = "update"
                        node.nodeValue = nodeValue
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
                    arr[index] = scanTag(node, vm)
                }
                break
        }
    })
    return arr
}