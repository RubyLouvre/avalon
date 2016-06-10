function anonymous(__vmodel__, __local__
        /**/) {
    __local__ = __local__ || {};
    var __present__, __top__, __synth__;

    var vnodes = [];
    (function (__vmodel__) {
        var __top__ = __vmodel__
        var __present__ = avalon.vmodels["duplex2"]
        if (__present__ && __top__ && __present__ !== __top__) {
            var __synth__ = avalon.mediatorFactory(__vmodel__, __present__)
            var __vmodel__ = __synth__
        } else {
            __vmodel__ = __top__ || __present__
        }
        /*controller:duplex2*/


        vnodes.push({
            props: {},
            type: "div",
            nodeType: 1,
            template: "",
            "ms-controller": "duplex2",
            synth: __synth__,
            local: __local__,
            top: __top__,
            present: __present__,
            order: "ms-controller",
            children: (function () {
                var vnodes = [];
                vnodes.push({
                    props: {},
                    type: "ul",
                    nodeType: 1,
                    template: "",
                    skipAttrs: true,
                    order: "",
                    children: (function () {
                        var vnodes = [];
                        vnodes.push({
                            directive: "for",
                            vmodel: __vmodel__,
                            nodeType: 8,
                            type: "#comment",
                            nodeValue: "ms-for:el in @arr",
                            signature: "for7839",
                            cid: "undefined:cb",
                            template: "<li ms-click=\"@dd(el)\">{{el}}</li>"});

                        var loop = (function () {
                            try {
                                var __value__ = __vmodel__.arr
                                return __value__
                            } catch (e) {
                                avalon.warn(e, "parse other binding【 @arr 】fail")
                                return ""
                            }
                        })()
                        var for7839 = vnodes[vnodes.length - 1]
                        avalon._each(loop, function ($key, el, traceKey) {
                            __local__ = avalon.mix(__local__, {"$key": $key,
                                "el": el})

                            vnodes.push({
                                props: {},
                                type: "li",
                                nodeType: 1,
                                template: "",
                                vmodel: __vmodel__,
                                local: __local__,
                                "ms-on-click-0": (function () {
                                    var fn610 = function ms_on($event, __local__) {
                                        try {
                                            var el = __local__["el"]
                                            var __vmodel__ = this;
                                            __vmodel__.dd(el)
                                        } catch (e) {
                                            avalon.warn(e, "parse on binding【 @dd(el) 】fail")
                                        }
                                    }
                                    avalon.eventListeners["eclick_0_0dd1el2"] = fn610
                                    fn610.uuid = "eclick_0_0dd1el2";
                                    return fn610
                                })(),
                                order: "ms-on-click-0",
                                children: (function () {
                                    var vnodes = [];
                                    vnodes.push({
                                        type: "#text",
                                        nodeType: 3,
                                        fixIESkip: true,
                                        nodeValue: el
                                    });

                                    return vnodes
                                })()});

                            vnodes.push({
                                nodeType: 8,
                                type: "#comment",
                                nodeValue: "for7839",
                                key: traceKey});

                        })
                        for7839.end = vnodes.push({
                            nodeType: 8,
                            type: "#comment",
                            signature: "for7839",
                            nodeValue: "ms-for-end:"});

                        return vnodes
                    })()});

                vnodes.push({
                    props: {type: "button"},
                    type: "button",
                    nodeType: 1,
                    template: "xxx",
                    vmodel: __vmodel__,
                    local: __local__,
                    "ms-on-click-0": (function () {
                        var fn610 = function ms_on($event, __local__) {
                            try {

                                console.log(__local__)
                                var __vmodel__ = this;
                                __vmodel__.resort($event)
                            } catch (e) {
                                avalon.warn(e, "parse on binding【 @resort 】fail")
                            }
                        }
                        avalon.eventListeners["eclick_0_0resort"] = fn610
                        fn610.uuid = "eclick_0_0resort";
                        return fn610
                    })(),
                    order: "ms-on-click-0",
                    children: []});

                return vnodes
            })()});

        /*controller:duplex2*/
    })(__vmodel__);
    return vnodes

}