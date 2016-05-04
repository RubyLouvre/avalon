function anonymous(__vmodel__
        /**/) {
    var vnodes146234 = []
    var vnode146234 = {
        nodeType: 1,
        type: "body",
        props: {},
        children: [],
        isVoidTag: false,
        template: ""}
    vnode146234.order = "ms-controller"
    var vm146234 = avalon.vmodels["test"]
    if (vm146234) {
        if (__vmodel__) {
            __vmodel__ = avalon.mediatorFactory(__vmodel__, vm146234)
        } else {
            __vmodel__ = vm146234
        }
    }


    vnode146234.children = (function () {

        var vnodes146234 = []
        var vnode146234 = {
            nodeType: 1,
            type: "div",
            props: {},
            children: [],
            isVoidTag: false,
            template: ""}
        vnode146234.props.id = "aaa"
        vnode146234.props.style = "background: red;width:200px;height: 200px;"
        vnode146234.skipAttrs = true
        vnode146234.children = (function () {

            var vnodes146234 = []
            var vnode146234 = {type: "#text", nodeType: 3, skipContent: true}
            vnode146234.nodeValue = String((function () {
                try {
                    var __value__ = __vmodel__.aaa
                    return __value__ == null ? "" : __value__
                } catch (e) {
                    avalon.warn(e, "parse text binding【 #aaa 】fail")
                    return ""
                }
            })() + "\n            ")
            vnode146234.fixIESkip = true
            vnode146234.skipContent = false
            vnodes146234.push(vnode146234)
            var vnode146234 = {
                nodeType: 1,
                type: "div",
                props: {},
                children: [],
                isVoidTag: false,
                template: ""}
            vnode146234.props.id = "eee"
            vnode146234.props["class"] = "kkk"
            vnode146234.order = "ms-important"
            vnode146234.props.wid = "w449610821626"
            vnode146234 = avalon.c(vnode146234, "var vnodes146234 = []\nvar vnode146234 = {\n\tnodeType:1,\n\ttype: \"div\",\n\tprops:{},\n\tchildren: [],\n\tisVoidTag: false,\n\ttemplate: \"\"}\nvnode146234.props.id = \"eee\"\nvnode146234.props[\"class\"] = \"kkk\"\nvnode146234.props.wid = \"w449610821626\"\n\tvnode146234.skipAttrs = true\nvnode146234.children = (function(){\n\nvar vnodes146234 = []\nvar vnode146234 = {type:\"#text\",nodeType:3,skipContent:true}\nvnode146234.nodeValue = String((function(){\ntry{\nvar __value__ = __vmodel__.ccc\nreturn __value__ == null ? \"\" :__value__\n}catch(e){\n\tavalon.warn(e, \"parse text binding【 #ccc 】fail\")\n\treturn \"\"\n}\n})() + \"\\n            \")\nvnode146234.fixIESkip = true\nvnode146234.skipContent = false\nvnodes146234.push(vnode146234)\n\n\nreturn vnodes146234\n})();\n\nvnodes146234.push(vnode146234)\n\n\nreturn vnodes146234", "test2")
            vnodes146234.push(vnode146234)
            var vnode146234 = {type: "#text", nodeType: 3, skipContent: true}
            vnode146234.nodeValue = String((function () {
                try {
                    var __value__ = __vmodel__.bbb
                    return __value__ == null ? "" : __value__
                } catch (e) {
                    avalon.warn(e, "parse text binding【 #bbb 】fail")
                    return ""
                }
            })() + "\n        ")
            vnode146234.fixIESkip = true
            vnode146234.skipContent = false
            vnodes146234.push(vnode146234)


            return vnodes146234
        })();

        vnodes146234.push(vnode146234)


        return vnodes146234
    })();

    vnodes146234.push(vnode146234)


    return vnodes146234
}