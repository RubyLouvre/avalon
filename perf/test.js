function anonymous(__vmodel__) {
    var vnodes146112 = []
    var vnode146112 = {
        nodeType: 1,
        type: "body",
        props: {},
        children: [],
        isVoidTag: false,
        template: ""}
    vnode146112.order = "ms-controller"



    var vm146112 = avalon.vmodels["test"]
    if (vm146112) {
        if (__vmodel__) {
            __vmodel__ = avalon.mediatorFactory(__vmodel__, vm146112)
        } else {
            __vmodel__ = vm146112
        }
    }


    vnode146112.children = (function () {

        var vnodes146112 = []
        var vnode146112 = {
            nodeType: 1,
            type: "p",
            props: {},
            children: [],
            isVoidTag: false,
            template: ""}
        vnode146112.skipAttrs = true
        vnode146112.children = (function () {

            var vnodes146112 = []
            var vnode146112 = {type: "#text", nodeType: 3, skipContent: true}
            vnode146112.nodeValue = (function () {
                try {
                    var __value__ = __vmodel__.aaa
                    return __value__
                } catch (e) {
                    avalon.warn(e, "parse other binding【 @aaa 】fail")
                    return ""
                }
            })()
            vnode146112.fixIESkip = true
            vnode146112.skipContent = false
            vnodes146112.push(vnode146112)


            return vnodes146112
        })();

        vnodes146112.push(vnode146112)
        var vnode146112 = {
            nodeType: 1,
            type: "div",
            props: {},
            children: [],
            isVoidTag: false,
            template: ""}
        vnode146112.order = "ms-controller"



        var vm146112 = avalon.vmodels["test2"]
        if (vm146112) {
            if (__vmodel__) {
                __vmodel__ = avalon.mediatorFactory(__vmodel__, vm146112)
            } else {
                __vmodel__ = vm146112
            }
        }


        vnode146112.children = (function () {

            var vnodes146112 = []
            var vnode146112 = {type: "#text", nodeType: 3, skipContent: true}
            vnode146112.nodeValue = String((function () {
                try {
                    var __value__ = __vmodel__.aaa
                    return __value__
                } catch (e) {
                    avalon.warn(e, "parse other binding【 @aaa 】fail")
                    return ""
                }
            })() + "::" + (function () {
                try {
                    var __value__ = __vmodel__.ddd
                    return __value__
                } catch (e) {
                    avalon.warn(e, "parse other binding【 @ddd 】fail")
                    return ""
                }
            })() + "\n        ")
            vnode146112.fixIESkip = true
            vnode146112.skipContent = false
            vnodes146112.push(vnode146112)


            return vnodes146112
        })();

        vnodes146112.push(vnode146112)
        var vnode146112 = {
            nodeType: 1,
            type: "div",
            props: {},
            children: [],
            isVoidTag: false,
            template: ""}
        vnode146112.order = "ms-important"



        var vm146112 = avalon.vmodels["test3"]
        if (vm146112) {
            __vmodel__ = vm146112
        }


        vnode146112.children = (function () {

            var vnodes146112 = []
            var vnode146112 = {type: "#text", nodeType: 3, skipContent: true}
            vnode146112.nodeValue = String((function () {
                try {
                    var __value__ = __vmodel__.aaa
                    return __value__
                } catch (e) {
                    avalon.warn(e, "parse other binding【 @aaa 】fail")
                    return ""
                }
            })() + "::" + (function () {
                try {
                    var __value__ = __vmodel__.ddd
                    return __value__
                } catch (e) {
                    avalon.warn(e, "parse other binding【 @ddd 】fail")
                    return ""
                }
            })() + "\n        ")
            vnode146112.fixIESkip = true
            vnode146112.skipContent = false
            vnodes146112.push(vnode146112)


            return vnodes146112
        })();

        vnodes146112.push(vnode146112)


        return vnodes146112
    })();

    vnodes146112.push(vnode146112)


    return vnodes146112
}