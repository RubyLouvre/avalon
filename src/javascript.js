function anonymous(__vmodel__, __fast__) {
    var vnodes146436 = []
    var vnode146436 = {
        nodeType: 1,
        type: "table",
        props: {},
        children: [],
        isVoidTag: false,
        template: ""}
    vnode146436.props.border = "1"
    vnode146436.props.width = "200"
    vnode146436.order = "ms-controller"
    if (!vnodes146436.vm) {
        vnodes146436.vm = __vmodel__
    }
    __vmodel__ = vnodes146436.vm || __vmodel__
    vnode146436.props["ms-controller"] = "test";
    var vm146436 = avalon.vmodels["test"]
    if (!vm146436) {
        return
    }
    vnode146436.bottom = vm146436
    if (__vmodel__) {
        vnode146436.top = __vmodel__
        var __id__ = __vmodel__.$id + "_" + "test"
        __vmodel__ = avalon.caches[__id__] || (avalon.caches[__id__] = avalon.mediatorFactory(__vmodel__, vm146436))
        vnode146436.mediator = __vmodel__
    } else {
        __vmodel__ = vm146436
    }
    if (!avalon.skipController(__fast__, vnode146436.bottom)) {
        vnode146436.children = (function () {

            var vnodes146436 = []
            var vnode146436 = {
                nodeType: 1,
                type: "tbody",
                props: {},
                children: [],
                isVoidTag: false,
                template: ""}
            vnode146436.skipAttrs = true
            vnode146436.children = (function () {

                var vnodes146436 = []

                var for702782953768 = {
                    nodeType: 8,
                    type: "#comment",
                    vmodel: __vmodel__,
                    directive: "for",
                    skipContent: false,
                    cid: "undefined:cb",
                    start: vnodes146436.length,
                    signature: "for702782953768",
                    template: "<tr><!--ms-for:elem in el--><td>{{elem}}</td><!--ms-for-end:--></tr>",
                    nodeValue: "ms-for:el in @array"
                }
                vnodes146436.push(for702782953768)
                var loop146436 = (function () {
                    try {
                        var __value__ = __vmodel__.array
                        return __value__
                    } catch (e) {
                        avalon.warn(e, "parse other binding【 @array 】fail")
                        return ""
                    }
                })()
                for702782953768.hasChange = avalon._checkLoopChange("for702782953768", loop146436, "")
                avalon._each(loop146436, function ($key, el, traceKey) {
                    var vnode146436 = {
                        nodeType: 1,
                        type: "tr",
                        props: {},
                        children: [],
                        isVoidTag: false,
                        template: ""}
                    vnode146436.skipAttrs = true
                    vnode146436.children = (function () {

                        var vnodes146436 = []

                        var for373493398676 = {
                            nodeType: 8,
                            type: "#comment",
                            vmodel: __vmodel__,
                            directive: "for",
                            skipContent: false,
                            cid: "undefined:cb",
                            start: vnodes146436.length,
                            signature: "for373493398676",
                            template: "<td>{{elem}}</td>",
                            nodeValue: "ms-for:elem in el"
                        }
                        vnodes146436.push(for373493398676)
                        var loop146436 = (function () {
                            try {
                                var __value__ = el
                                return __value__
                            } catch (e) {
                                avalon.warn(e, "parse other binding【 el 】fail")
                                return ""
                            }
                        })()
                        for373493398676.hasChange = avalon._checkLoopChange("for373493398676", loop146436, "")
                        avalon._each(loop146436, function ($key, elem, traceKey) {
                            var vnode146436 = {
                                nodeType: 1,
                                type: "td",
                                props: {},
                                children: [],
                                isVoidTag: false,
                                template: ""}
                            vnode146436.skipAttrs = true
                            vnode146436.children = (function () {

                                var vnodes146436 = []
                                var vnode146436 = {type: "#text", nodeType: 3, skipContent: true}
                                vnode146436.nodeValue = elem
                                vnode146436.fixIESkip = true
                                vnode146436.skipContent = false
                                vnodes146436.push(vnode146436)


                                return vnodes146436
                            })();

                            vnodes146436.push(vnode146436)
                            vnodes146436.push({
                                nodeType: 8,
                                type: "#comment",
                                skipContent: true,
                                nodeValue: "for373493398676",
                                key: traceKey
                            })

                        })
                        for373493398676.end = vnodes146436.push({
                            nodeType: 8,
                            type: "#comment",
                            skipContent: true,
                            signature: "for373493398676",
                            nodeValue: "ms-for-end:"
                        })


                        return vnodes146436
                    })();

                    vnodes146436.push(vnode146436)
                    vnodes146436.push({
                        nodeType: 8,
                        type: "#comment",
                        skipContent: true,
                        nodeValue: "for702782953768",
                        key: traceKey
                    })

                })
                for702782953768.end = vnodes146436.push({
                    nodeType: 8,
                    type: "#comment",
                    skipContent: true,
                    signature: "for702782953768",
                    nodeValue: "ms-for-end:"
                })


                return vnodes146436
            })();

            vnodes146436.push(vnode146436)


            return vnodes146436
        })();

        vnodes146436.push(vnode146436)
    }

    return vnodes146436
}