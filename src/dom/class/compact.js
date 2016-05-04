var rnowhite = /\S+/g
var fakeClassListMethods = {
    _toString: function () {
        var node = this.node
        var cls = node.className
        var str = typeof cls === 'string' ? cls : cls.baseVal
        var match = str.match(rnowhite)
        return match ? match.join(' ') : ''
    },
    _contains: function (cls) {
        return (' ' + this + ' ').indexOf(' ' + cls + ' ') > -1
    },
    _add: function (cls) {
        if (!this.contains(cls)) {
            this._set(this + ' ' + cls)
        }
    },
    _remove: function (cls) {
        this._set((' ' + this + ' ').replace(' ' + cls + ' ', ' '))
    },
    __set: function (cls) {
        cls = cls.trim()
        var node = this.node
        if (typeof node.className === 'object') {
            //SVG元素的className是一个对象 SVGAnimatedString { baseVal='', animVal=''}，只能通过set/getAttribute操作
            node.setAttribute('class', cls)
        } else {
            node.className = cls
        }
    } //toggle存在版本差异，因此不使用它
}

function fakeClassList(node) {
    if (!('classList' in node)) {
        node.classList = {
            node: node
        }
        for (var k in fakeClassListMethods) {
            node.classList[k.slice(1)] = fakeClassListMethods[k]
        }
    }
    return node.classList
}


'add,remove'.replace(avalon.rword, function (method) {
    avalon.fn[method + 'Class'] = function (cls) {
        var el = this[0] || {}
        //https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/26
        if (cls && typeof cls === 'string' && el.nodeType === 1) {
            cls.replace(rnowhite, function (c) {
                fakeClassList(el)[method](c)
            })
        }
        return this
    }
})

avalon.fn.mix({
    hasClass: function (cls) {
        var el = this[0] || {}
        return el.nodeType === 1 && fakeClassList(el).contains(cls)
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

