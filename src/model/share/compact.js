var share = require('./share')
var canHideProperty = require('./canHideProperty')

function toJson(val) {
    var xtype = avalon.type(val)
    if (xtype === 'array') {
        var array = []
        for (var i = 0; i < val.length; i++) {
            array[i] = toJson(val[i])
        }
        return array
    } else if (xtype === 'object') {
        var obj = {}
        for (i in val) {
            if (val.hasOwnProperty(i)) {
                var value = val[i]
                obj[i] = value && value.nodeType ? value : toJson(value)
            }
        }
        return obj
    }
    return val
}

function hideProperty(host, name, value) {
    if (canHideProperty) {
        Object.defineProperty(host, name, {
            value: value,
            writable: true,
            enumerable: false,
            configurable: true
        })
    } else {
        host[name] = value
    }
}

var $modelAccessor = {
    get: function () {
        return toJson(this)
    },
    set: avalon.noop,
    enumerable: false,
    configurable: true
}

share.$$midway.hideProperty = hideProperty

var mixin = {
    toJson: toJson,
    $modelAccessor: $modelAccessor
}
for (var i in share) {
    mixin[i] = share[i]
}

module.exports = share
