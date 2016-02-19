var scanAttrs = require("./scanAttrs")

function scanTag(elem, vmodel, siblings) {
    var props = elem.props
    //更新数据
    var v = props["avalonctrl"]
    if (v) {
        var vm = avalon.vmodels[v]
        if (vm) {
            avalon.vtree[v] = elem
            if (props["data-important"]) {
                vmodel = vm
            } else {
                vmodel = vmodel ? avalon.mediatorFactory(vmodel, vm) : vm
            }

        } else {
            return avalon.log("[" + v + "] vmodel has not defined yet!")
        }
    }


    if (elem.type.indexOf(":") > 0 && !avalon.components[elem.type]) {
        //avalon.component(elem)
    } else {
        vmodel && scanAttrs(elem, vmodel, siblings)

    }
    return vmodel

}

module.exports = scanTag