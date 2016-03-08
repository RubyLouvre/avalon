
avalon.component("av-button", {
    template: "<button type='button' aaa='test'><span>{{@text}}</span></button>",
    createVm: function (topVm, defaults, options) {
        var after = avalon.mix({}, defaults, options)
        var events = {}
        "$init $ready $dispose".replace(/\w+/g, function (a) {
            if (typeof after[a] === "function")
                events[a] = after[a]
            delete after[a]
        })
        var vm = avalon.mediatorFactory(topVm, after)
        for(var i in events){
            vm.$watch(i, events[i])
        }
        return vm
    },
    defaults: {
        text: "按钮"
    },
    diff: function (cur, pre) {

    }
})