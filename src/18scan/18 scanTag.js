function scanTag(elem, vmodel) {
    var props = elem.props
    //更新数据
    var v = props["data-important"]
    var vm = avalon.vmodels[v]
    if (vm) {
        vmodel = vm
    } else {
        v = props["data-controller"]
        vm = avalon.vmodels[v]
        if (vm) {
            if (vmodel) {
                vm = avalon.createProxy(vmodel, vm)
            }
            vmodel = vm
        }
    }
    if (v && !vm) {
        return avalon.log("[" + v + "] vmodel has not defined yet!")
    }
    
    if (elem.type.indexOf(":") > 0 && !avalon.components[elem.type]) {
        //avalon.component(elem)
    } else {
        scanAttrs(elem, vmodel)
    }
    return elem
}


