import avalon from '../seed/core'
import {warlords} from './warlords'
import {$emit, $watch} from './dispatch'
import {$$skipArray} from './skipArray'
import './methods.common'

warlords.$$skipArray = $$skipArray

warlords.canHideProperty = true

function toJson(val) {
    switch (avalon.type(val)) {
        case 'array':
            var array = []
            for (var i = 0; i < val.length; i++) {
                array[i] = toJson(val[i])
            }
            return array
        case 'object':
            var obj = {}
            for (i in val) {
                if (val.hasOwnProperty(i)) {
                    var value = val[i]
                    obj[i] = value && value.nodeType ? value : toJson(value)
                }
            }
            return obj
        default:
            return val
    }
}

warlords.toJson = toJson
warlords.toModel = function () { }

function hideProperty(host, name, value) {
    Object.defineProperty(host, name, {
        value: value,
        writable: true,
        enumerable: false,
        configurable: true
    })
}

warlords.hideProperty = hideProperty

var modelAccessor = {
    get: function () {
        return toJson(this)
    },
    set: avalon.noop,
    enumerable: false,
    configurable: true
}

warlords.modelAccessor = modelAccessor


function initViewModel($vmodel, heirloom, keys, accessors, options) {
    if (options.array) {
        hideProperty($vmodel, '$model', modelAccessor)
    } else {
        hideProperty($vmodel, '$accessors', accessors)
        hideProperty($vmodel, 'hasOwnProperty', function (key) {
            return keys[key] === true
        })
        hideProperty($vmodel, '$track', Object.keys(keys).sort().join(';;'))
    }
    hideProperty($vmodel, '$id', options.id)
    hideProperty($vmodel, '$hashcode', options.hashcode)
    if (options.master === true) {
        hideProperty($vmodel, '$run', run)
        hideProperty($vmodel, '$wait', wait)
        heirloom.__vmodel__ = $vmodel
        hideProperty($vmodel, '$events', heirloom)
        hideProperty($vmodel, '$watch', $watch)
        hideProperty($vmodel, '$fire', function (expr, a, b) {
            var list = $vmodel.$events[expr]
            $emit(list, $vmodel, expr, a, b)
        })
    }
}

warlords.initViewModel = initViewModel

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

warlords.createViewModel = Object.defineProperties
