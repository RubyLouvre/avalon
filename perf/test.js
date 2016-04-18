function anonymous(__vmodel__) {
    var vnodes146097 = []
    var vnode146097 = {
        nodeType: 1,
        type: "button",
        props: {},
        children: [],
        isVoidTag: false,
        template: ""}
    vnode146097.props.type = "button"
    vnode146097.props.resolved = true
    vnode146097.props["class"] = "ani"
    vnode146097.props.wid = "w77033125595"
    vnode146097.order = "ms-effect;;ms-if;;ms-attr"
    vnode146097.props["ms-effect"] = (function () {
        try {
            var __value__ = {is: 'zoom'}
            return __value__
        } catch (e) {
            avalon.warn(e, "parse effect binding【 {is:'zoom'} 】fail")
            return ""
        }
    })();
    var ifVar = (function () {
        try {
            var __value__ = __vmodel__.toggle
            return __value__
        } catch (e) {
            avalon.warn(e, "parse if binding【 @toggle 】fail")
            return ""
        }
    })();
    vnode146097.props["ms-if"] = ifVar;
    if (!ifVar) {
        vnode146097.nodeType = 8;
        vnode146097.directive = "if";
        vnode146097.nodeValue = "ms-if"
    }
    vnode146097.props["ms-attr"] = (function () {
        try {
            var __value__ = {eee: el}
            return __value__
        } catch (e) {
            avalon.warn(e, "parse attr binding【 {eee:el} 】fail")
            return ""
        }
    })();
    if (vnode146097.nodeType === 1) {
        vnode146097.children = (function () {

            var vnodes146097 = []
            var vnode146097 = {
                nodeType: 1,
                type: "span",
                props: {},
                children: [],
                isVoidTag: false,
                template: ""}
            vnode146097.skipAttrs = true
            vnode146097.children = (function () {

                var vnodes146097 = []
                var vnode146097 = {type: "#text", nodeType: 3, skipContent: true}
                vnode146097.nodeValue = (function () {
                    try {
                        var __value__ = __vmodel__.aaa
                        return __value__
                    } catch (e) {
                        avalon.warn(e, "parse other binding【 @aaa 】fail")
                        return ""
                    }
                })()
                vnode146097.fixIESkip = true
                vnode146097.skipContent = false
                vnodes146097.push(vnode146097)


                return vnodes146097
            })();

            vnodes146097.push(vnode146097)


            return vnodes146097
        })();

    }
    vnodes146097.push(vnode146097)


    return vnodes146097

}