bindingHandlers.widget = function(data, vmodels) {
    var args = data.value.match(rword)
    var elem = data.element
    var widget = args[0]
    var id = args[1]
    if (!id || id === "$") {//没有定义或为$时，取组件名+随机数
        id = generateID(widget)
    }
    var optName = args[2] || widget//没有定义，取组件名
    vmodels.cb(-1)
    var constructor = avalon.ui[widget]
    if (typeof constructor === "function") { //ms-widget="tabs,tabsAAA,optname"
        vmodels = elem.vmodels || vmodels
        for (var i = 0, v; v = vmodels[i++]; ) {
            if (v.hasOwnProperty(optName) && typeof v[optName] === "object") {
                var vmOptions = v[optName]
                vmOptions = vmOptions.$model || vmOptions
                break
            }
        }
        if (vmOptions) {
            var wid = vmOptions[widget + "Id"]
            if (typeof wid === "string") {
                id = wid
            }
        }
        //抽取data-tooltip-text、data-tooltip-attr属性，组成一个配置对象
        var widgetData = avalon.getWidgetData(elem, widget)
        data.value = [widget, id, optName].join(",")
        data[widget + "Id"] = id
        data.evaluator = noop
        elem.msData["ms-widget-id"] = id
        var options = data[widget + "Options"] = avalon.mix({}, constructor.defaults, vmOptions || {}, widgetData)
        elem.removeAttribute("ms-widget")
        var vmodel = constructor(elem, data, vmodels) || {} //防止组件不返回VM
        if (vmodel.$id) {
            avalon.vmodels[id] = vmodel
            createSignalTower(elem, vmodel)
            if (vmodel.hasOwnProperty("$init")) {
                vmodel.$init(function() {
                    var nv = [vmodel].concat(vmodels)
                    nv.cb = vmodels.cb
                    avalon.scan(elem, nv)
                    if (typeof options.onInit === "function") {
                        options.onInit.call(elem, vmodel, options, vmodels)
                    }
                })
            }
            if (vmodel.hasOwnProperty("$remove")) {
                function offTree() {
                    if (!elem.msRetain &&!root.contains(elem)) {
                        vmodel.$remove()
                        try {
                            vmodel.widgetElement = null
                        } catch (e) {
                        }
                        elem.msData = {}
                        delete avalon.vmodels[vmodel.$id]
                        return false
                    }
                }
                if (window.chrome) {
                    elem.addEventListener("DOMNodeRemovedFromDocument", function() {
                        setTimeout(offTree)
                    })
                } else {
                    avalon.tick(offTree)
                }
            }
        } else {
            avalon.scan(elem, vmodels)
        }
    } else if (vmodels.length) { //如果该组件还没有加载，那么保存当前的vmodels
        elem.vmodels = vmodels
    }
}
//不存在 bindingExecutors.widget