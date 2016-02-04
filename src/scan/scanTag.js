var scanAttrs = require("./scanAttrs")

function scanTag(elem, vmodel, siblings) {
    var props = elem.props
    //更新数据
    var hasCtrl = props["data-controller"]
    if (hasCtrl) {
        var v = hasCtrl.slice(0, -2)
        var isImportant = v.slice(-2) === "!!"
        var vm = avalon.vmodels[v]
        if (vm) {
            avalon.vtree[v] = elem
            if (isImportant) {
                vmodel = vm
            } else {
                vmodel = avalon.mediatorFactory(vmodel, vm)
            }

        } else {
            return avalon.log("[" + v + "] vmodel has not defined yet!")
        }
    }


    if (elem.type.indexOf(":") > 0 && !avalon.components[elem.type]) {
        //avalon.component(elem)
    } else {
        scanAttrs(elem, vmodel, siblings)

    }
    return vmodel

}

module.exports = scanTag