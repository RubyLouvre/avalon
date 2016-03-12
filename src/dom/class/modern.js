var rnowhite = /\S+/g

'add,remove'.replace(avalon.rword, function (method) {
    avalon.fn[method + 'Class'] = function (cls) {
        var el = this[0] || {}
        //https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/26
        if (cls && typeof cls === 'string' && el.nodeType === 1) {
            cls.replace(rnowhite, function (c) {
                el.classList[method](c)
            })
        }
        return this
    }
})

avalon.fn.mix({
    hasClass: function (cls) {
        var el = this[0] || {}
        //IE10+, chrome8+, firefox3.6+, safari5.1+,opera11.5+支持classList,
        //chrome24+,firefox26+支持classList2.0
        return el.nodeType === 1 && el.classList.contains(cls)
    },
    toggleClass: function (value, stateVal) {
        var isBool = typeof stateVal === 'boolean'
        var me = this
        String(value).replace(rnowhite, function (c) {
            var state = isBool ? stateVal : !me.hasClass(c)
            me[state ? 'addClass' : 'removeClass'](c)
        })
        return this
    }
})

