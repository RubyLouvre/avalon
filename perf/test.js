function anonymous(__vmodel__) {
    var vnodes146098 = []
    var vnode146098 = {
        nodeType: 1,
        type: "div",
        props: {},
        children: [],
        isVoidTag: false,
        template: ""}
    vnode146098.order = "ms-controller"


    var vm146098 = avalon.vmodels["if2"]
    if (vm146098) {
        if (__vmodel__) {
            __vmodel__ = avalon.mediatorFactory(__vmodel__, vm146098)
        } else {
            __vmodel__ = vm146098
        }
    }


    vnode146098.children = (function () {

        var vnodes146098 = []

        var for300971289219 = {
            nodeType: 8,
            type: "#comment",
            vmodel: __vmodel__,
            directive: "for",
            skipContent: false,
            cid: "undefined:cb",
            start: vnodes146098.length,
            signature: "for300971289219",
            nodeValue: "ms-for:(jj, el) in @panels"
        }
        vnodes146098.push(for300971289219)
        var loop146098 = (function () {
            try {
                var __value__ = __vmodel__.panels
                return __value__
            } catch (e) {
                avalon.warn(e, "parse other binding【 @panels 】fail")
                return ""
            }
        })()
        avalon._each(loop146098, function (jj, el, traceKey) {
            var vnode146098 = {
                nodeType: 1,
                type: "div",
                props: {},
                children: [],
                isVoidTag: false,
                template: ""}
            vnode146098.props["class"] = "panel"
            vnode146098.order = "ms-if;;ms-html"
            var ifVar = (function () {
                try {
                    var __value__ = jj === __vmodel__.curIndex
                    return __value__
                } catch (e) {
                    avalon.warn(e, "parse if binding【 jj === @curIndex 】fail")
                    return ""
                }
            })();
            vnode146098.props["ms-if"] = ifVar;
            if (!ifVar) {
                vnode146098.nodeType = 8;
                vnode146098.directive = "if";
                vnode146098.nodeValue = "ms-if"
            }
            vnode146098.htmlVm = __vmodel__
            vnode146098.skipContent = true
            vnode146098.props["ms-html"] = (function () {
                try {
                    var __value__ = el
                    return __value__
                } catch (e) {
                    avalon.warn(e, "parse html binding【 el 】fail")
                    return ""
                }
            })();
            vnode146098.template = ""
            vnodes146098.push(vnode146098)
            vnodes146098.push({
                nodeType: 8,
                type: "#comment",
                skipContent: true,
                nodeValue: "for300971289219",
                key: traceKey
            })

        })
        for300971289219.end = vnodes146098.push({
            nodeType: 8,
            type: "#comment",
            skipContent: true,
            signature: "for300971289219",
            nodeValue: "for300971289219:end"
        })


        return vnodes146098
    })();

    vnodes146098.push(vnode146098)


    return vnodes146098
}