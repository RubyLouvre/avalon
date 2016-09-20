var share = require('./share')
var initEvents = share.initEvents

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
    Object.defineProperty(host, name, {
        value: value,
        writable: true,
        enumerable: false,
        configurable: true
    })
}

var modelAccessor = {
    get: function () {
        return toJson(this)
    },
    set: avalon.noop,
    enumerable: false,
    configurable: true
}

share.$$midway.hideProperty = hideProperty

function initViewModel($vmodel, heirloom, keys, accessors, options) {

    if (options.array) {
        Object.defineProperty($vmodel, '$model', modelAccessor)
    } else {
        function hasOwnKey(key) {
            return keys[key] === true
        }
        hideProperty($vmodel, 'hasOwnProperty', hasOwnKey)
    }
    hideProperty($vmodel, '$id', options.id)
    hideProperty($vmodel, '$hashcode', options.hashcode)
    hideProperty($vmodel, '$track', Object.keys(keys).sort().join(';;'))
    if (options.master === true) {
        hideProperty($vmodel, '$run', run)
        hideProperty($vmodel, '$wait', wait)
        hideProperty($vmodel, '$element', null)
        hideProperty($vmodel, '$render', 0)
        initEvents($vmodel, heirloom)
    }
}
function wait() {
    this.$events.$$wait$$ = true
}

function run() {
    var host = this.$events
    delete host.$$wait$$
    if (host.$$dirty$$) {
        delete host.$$dirty$$
        avalon.rerenderStart = new Date
        var id = this.$id
        var dotIndex = id.indexOf('.')
        if (dotIndex > 0) {
            avalon.batch(id.slice(0, dotIndex))
        } else {
            avalon.batch(id)
        }
    }
}

share.$$midway.initViewModel = initViewModel

var mixin = {
    toJson: toJson,
    initViewModel: initViewModel,
    modelAccessor: modelAccessor
}
for (var i in share) {
    mixin[i] = share[i]
}

module.exports = mixin
