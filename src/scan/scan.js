/*********************************************************************
 *                           扫描系统                                 *
 **********************************************************************/
var rbind = avalon.config.rbind
var scanNodes = require("./scanNodes")

var updateEntity = require("../strategy/updateEntity")
var createVirtual = require("../strategy/createVirtual")

avalon.scan = function (elem, vmodel) {
    var text = elem.outerHTML
    if (rbind.test(text)) {
        var tree = createVirtual(text)
        scanNodes(tree, vmodel)
        updateEntity([elem], tree)
    }
}



