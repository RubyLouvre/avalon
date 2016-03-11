
function VComponent(config) {
    for (var i in config) {
        this[i] = config[i]
    }
    var type = this.__type__ = this.type 
    
    this.type = '#component'
    var me = avalon.components[type]
    if (me && me.init && arguments.length) {
        me.init.apply(this, arguments)
    }
}

VComponent.prototype = {
    toDOM: function () {
        var me = avalon.components[this.__type__]
        if (me && me.toDOM) {
            return me.toDOM.call(this)
        }
        var fragment = document.createDocumentFragment()
        for (var i = 0; i < this.children.length; i++) {
            fragment.appendChild(this.children[i].toDOM())
        }
        return fragment
    },
    toHTML: function () {
        var me = avalon.components[this.__type__]
        if (me && me.toHTML) {
            return me.toHTML.call(this)
        }
        var ret = ''
        for (var i = 0; i < this.children.length; i++) {
            ret += this.children[i].toHTML()
        }
        return ret
    }
}


module.exports = VComponent