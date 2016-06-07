function anonymous(__vmodel__, __local__
        /**/) {
    __local__ = __local__ || {};
    var __present__, __top__, __synth__;

    var vnodes = [];
    (function (__vmodel__) {
        var __top__ = __vmodel__
        var __present__ = avalon.vmodels["page"]
        if (__present__ && __top__ && __present__ !== __top__) {
            var __synth__ = avalon.mediatorFactory(__vmodel__, __present__)
            var __vmodel__ = __synth__
        } else {
            __vmodel__ = __top__ || __present__
        }
        /*controller:page*/


        vnodes.push({
            props: {},
            type: "div",
            nodeType: 1,
            template: "",
            "ms-controller": "page",
            synth: __synth__,
            local: __local__,
            top: __top__,
            present: __present__,
            order: "ms-controller",
            children: (function () {
                var vnodes = [];
                vnodes.push({
                    directive: "for",
                    vmodel: __vmodel__,
                    nodeType: 8,
                    type: "#comment",
                    nodeValue: "ms-for:el in @array",
                    signature: "for9314500000000001",
                    cid: "undefined:cb",
                    template: "<p><ms-button ms-widget=\"{$id:@getId(el)}\">{{el.name}}</ms-button></p>"});

                var loop = (function () {
                    try {
                        var __value__ = __vmodel__.array
                        return __value__
                    } catch (e) {
                        avalon.warn(e, "parse other binding【 @array 】fail")
                        return ""
                    }
                })()
                var for9314500000000001 = vnodes[vnodes.length - 1]
                avalon._each(loop, function ($key, el, traceKey) {
                    __local__ = avalon.mix(__local__, {"$key": $key,
                        "el": el})

                    vnodes.push({
                        props: {},
                        type: "p",
                        nodeType: 1,
                        template: "",
                        skipAttrs: true,
                        order: "",
                        children: (function () {
                            var vnodes = [];
                            vnodes.push({
                                props: {},
                                type: "ms-button",
                                nodeType: 1,
                                template: "{{el.name}}",
                                wid: "w9733000000000001",
                                directive: "widget",
                                children: [],
                                "ms-widget": (function () {
                                    try {
                                        var __value__ = {$id: __vmodel__.getId(el)}
                                        return __value__
                                    } catch (e) {
                                        avalon.warn(e, "parse widget binding【 {$id:@getId(el)} 】fail")
                                        return ""
                                    }
                                })(),
                                order: "ms-widget"});

                            var curIndex = vnodes.length - 1
                            var el = vnodes[curIndex]
                            if (el.nodeType === 1) {
                                el.local = __local__
                                el.vmodel = __vmodel__
                                avalon.component(el, vnodes, curIndex, "w9733000000000001")
                            }
                            return vnodes
                        })()});

                    vnodes.push({
                        nodeType: 8,
                        type: "#comment",
                        nodeValue: "for9314500000000001",
                        key: traceKey});

                })
                for9314500000000001.end = vnodes.push({
                    nodeType: 8,
                    type: "#comment",
                    signature: "for9314500000000001",
                    nodeValue: "ms-for-end:"});

                return vnodes
            })()});

        /*controller:page*/
    })(__vmodel__);
    return vnodes

}