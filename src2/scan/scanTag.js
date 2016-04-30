function scanTag(elem, vmodel) {
   
    var a = elem.getAttribute("ms-skip"), node
    if (typeof a === 'string') {
        return
    }
   
    //#360 在旧式IE中 Object标签在引入Flash等资源时,可能出现没有getAttributeNode,innerHTML的情形
    if (!elem.getAttributeNode) {
        return log("warning " + elem.tagName + " no getAttributeNode method")
    }
    var b = elem.getAttributeNode("ms-important")
    var c = elem.getAttributeNode("ms-controller")
    if (node = (b || c)) {
        var newVmodel = avalon.vmodels[node.value]
        if (!newVmodel) {
            return
        }
        //ms-important不包含父VM，ms-controller相反
        if(node === b){
            vmodel = newVmodel
        }else{
            vmodel = avalon.mediatorFactory(vmodel, newVmodel)
        }
        //removeAttributeNode不会刷新[ms-controller]样式规则
        var name = node.name
        elem.removeAttribute(name) 
        avalon(elem).removeClass(name)
        createSignalTower(elem, newVmodel)
    }

    scanAttr(elem, vmodel) //扫描特性节点
    return vmodel
}

function createSignalTower(elem, vmodel) {
    var id = elem.getAttribute("avalonctrl") || vmodel.$id
    elem.setAttribute("avalonctrl", id)
    if (vmodel.$events) {
        vmodel.$events.expr = elem.tagName + '[avalonctrl="' + id + '"]'
    }
}

module.exports = scanTag