function anonymous(__vmodel__
        /**/) {
    var nodes145759 = []
    var vnode145759 = {
        type: "div",
        props: {},
        children: [],
        isVoidTag: false,
        template: ''}
    vnode145759.props.id = "test"
    vnode145759.skipAttrs = true
    if (!vnode145759.props.wid) {
        vnode145759.children = (function () {

            var nodes145759 = []
            var vnode145759 = {type: '#text', skipContent: true}
            vnode145759.nodeValue = "\n            "
            nodes145759.push(vnode145759)
            var vnode145759 = {
                type: "div",
                props: {},
                children: [],
                isVoidTag: false,
                template: ''}
            vnode145759.props.wid = 'w361349903047'
            vnode145759.children = avalon.caches[vnode145759.props.wid]
            var config145759 = vnode145759.props['av-widget'] = (function () {
                try {
                    var __value__ = [{$type: 'av:panel', $id: 'aa'}, __vmodel__.panel]
                    if (Array.isArray(__value__)) {
                        __value__ = avalon.mix.apply({}, __value__)
                    }
                    return __value__
                } catch (e) {
                    avalon.log(e, "parse \"[{$type:'av:panel',$id:'aa'}, @panel]\" fail")
                    return ''
                }
            })();
            if (config145759) {
                vnode145759 = avalon.component(vnode145759, __vmodel__)
            }
            if (!vnode145759.props.wid) {
                vnode145759.children = (function () {

                    var nodes145759 = []
                    var vnode145759 = {type: '#text', skipContent: true}
                    vnode145759.nodeValue = "\n                "
                    nodes145759.push(vnode145759)
                    var vnode145759 = {
                        type: "av-button",
                        props: {},
                        children: [],
                        isVoidTag: false,
                        template: ''}
                    vnode145759.props.wid = 'w561025492847'
                    vnode145759.children = avalon.caches[vnode145759.props.wid]
                    var config145759 = vnode145759.props['av-widget'] = (function () {
                        try {
                            var __value__ = {$ready: function (a) {
                                    console.log(a)
                                }}
                            if (Array.isArray(__value__)) {
                                __value__ = avalon.mix.apply({}, __value__)
                            }
                            return __value__
                        } catch (e) {
                            avalon.log(e, "parse \"{$ready: function(a){console.log(a)}}\" fail")
                            return ''
                        }
                    })();
                    if (config145759) {
                        vnode145759 = avalon.component(vnode145759, __vmodel__)
                    }
                    if (!vnode145759.props.wid) {
                        vnode145759.children = (function () {

                            var nodes145759 = []
                            var vnode145759 = {type: '#text', skipContent: true}
                            vnode145759.nodeValue = "xxx"
                            nodes145759.push(vnode145759)


                            return nodes145759
                        })();

                    }
                    nodes145759.push(vnode145759)
                    var vnode145759 = {type: '#text', skipContent: true}
                    vnode145759.nodeValue = "\n            "
                    nodes145759.push(vnode145759)


                    return nodes145759
                })();

            }
            nodes145759.push(vnode145759)
            var vnode145759 = {type: '#text', skipContent: true}
            vnode145759.nodeValue = "\n        "
            nodes145759.push(vnode145759)


            return nodes145759
        })();

    }
    nodes145759.push(vnode145759)


    return nodes145759
}