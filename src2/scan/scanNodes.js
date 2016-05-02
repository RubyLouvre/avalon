
var scanTag = require('./scanTag')
var scanText = require('./scanText')
function scanNodes(parent, vmodel) {
    var nodes = avalon.slice(parent.childNodes)
    scanNodeArray(nodes, vmodel)
}


var rexpr = /{{.*}}/
function scanNodeArray(nodes, vmodel) {

    for (var i = 0, node; node = nodes[i++]; ) {
        switch (node.nodeType) {
            case 1:
                vmodel = scanTag(node, vmodel) //扫描元素节点
                break
            case 3:
                if (rexpr.test(node.nodeValue)) {
                    scanText(node, vmodel) //扫描文本节点
                }
                break
        }

    }
}

//收集页面上的所有指令, 放到$watcher中


