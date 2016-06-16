var share = require('./share')
var canHideProperty = require('./canHideProperty')
var initEvents = share.initEvents

/*
 * toJson
 * hideProperty
 * initViewModel
 */

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
            if (i === '__proxy__' || i === '__data__' || i === '__const__')
                continue
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

var modelAccessor = {
    get: function () {
        return toJson(this)
    },
    set: avalon.noop,
    enumerable: false,
    configurable: true
}

function initViewModel($vmodel, heirloom, keys, accessors, options) {

    if (options.array) {
        if (avalon.modern) {
            Object.defineProperty($vmodel, '$model', modelAccessor)
        } else {
            $vmodel.$model = toJson($vmodel)
        }
    } else {
        function hasOwnKey(key) {
            return keys[key] === true
        }
        hideProperty($vmodel, '$accessors', accessors)
        hideProperty($vmodel, 'hasOwnProperty', hasOwnKey)
        hideProperty($vmodel, '$track', Object.keys(keys).sort().join(';;'))
    }
    hideProperty($vmodel, '$id', options.id)
    hideProperty($vmodel, '$hashcode', options.hashcode)
    if (options.master === true) {
        hideProperty($vmodel, '$run', function () {
            run.call($vmodel)
        })
        hideProperty($vmodel, '$wait', function () {
            wait.call($vmodel)
        })
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

share.$$midway.hideProperty = hideProperty

var mixin = {
    toJson: toJson,
    initViewModel: initViewModel,
    modelAccessor: modelAccessor
}
for (var i in share) {
    mixin[i] = share[i]
}

module.exports = mixin
