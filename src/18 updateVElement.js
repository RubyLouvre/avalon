function updateVElement(elem, vmodel) {
    var props = elem.props
     //更新数据
    var v = props["data-important"]
    var vm = avalon.vmodels[v]
    if (vm) {
        vmodel = vm.$model
    } else {
        v = props["data-controller"]
        vm = avalon.vmodels[v]
        if (vm) {
            vmodel = avalon.mix(vmodel, vm.$model)
        }
    }
    updateVProps(elem, vmodel) 
}
