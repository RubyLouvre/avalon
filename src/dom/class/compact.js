import { avalon, rnowhite, rword } from '../../seed/core'

export function ClassList(node) {
    this.node = node
}

ClassList.prototype = {
    toString() {
        var node = this.node
        var cls = node.className
        var str = typeof cls === 'string' ? cls : cls.baseVal
        var match = str.match(rnowhite)
        return match ? match.join(' ') : ''
    },
    contains(cls) {
        return (' ' + this + ' ').indexOf(' ' + cls + ' ') > -1
    },
    add(cls) {
        if (!this.contains(cls)) {
            this.set(this + ' ' + cls)
        }
    },
    remove(cls) {
        this.set((' ' + this + ' ').replace(' ' + cls + ' ', ' '))
    },
    set(cls) {
        cls = cls.trim()
        var node = this.node
        if (typeof node.className === 'object') {
            //SVG元素的className是一个对象 SVGAnimatedString { baseVal='', animVal=''}，只能通过set/getAttribute操作
            node.setAttribute('class', cls)
        } else {
            node.className = cls
        }
        if (!cls) {
            node.removeAttribute('class')
        }
        //toggle存在版本差异，因此不使用它
    }
}

export function classListFactory(node) {
    if (!('classList' in node)) {
        node.classList = new ClassList(node)
    }
    return node.classList
}


'add,remove'.replace(rword, function(method) {
    avalon.fn[method + 'Class'] = function(cls) {
        var el = this[0] || {}
            //https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/26
        if (cls && typeof cls === 'string' && el.nodeType === 1) {
            cls.replace(rnowhite, function(c) {
                classListFactory(el)[method](c)
            })
        }
        return this
    }
})

avalon.shadowCopy(avalon.fn, {
    hasClass: function(cls) {
        var el = this[0] || {}
        return el.nodeType === 1 && classListFactory(el).contains(cls)
    },
    toggleClass: function(value, stateVal) {
        var isBool = typeof stateVal === 'boolean'
        var me = this
        String(value).replace(rnowhite, function(c) {
            var state = isBool ? stateVal : !me.hasClass(c)
            me[state ? 'addClass' : 'removeClass'](c)
        })
        return this
    }
})