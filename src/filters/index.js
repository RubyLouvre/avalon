
var avalon = require('../seed/core')
var number = require("./number")
var sanitize = require("./sanitize")
var date = require("./date")
var arrayFilters = require("./array")
var eventFilters = require("./event")
var filters = avalon.filters
var escape = avalon.escapeHtml = require("./escape")

function K(a) {
    /* istanbul ignore next*/
    return a
}

avalon.__format__ = function (name) {
    var fn = filters[name]
    if (fn) {
        return fn
    }
    return K
}


avalon.mix(filters, {
    uppercase: function (str) {
        return String(str).toUpperCase()
    },
    lowercase: function (str) {
        return String(str).toLowerCase()
    },
    truncate: function (str, length, end) {
        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        if (!str) {
            return ''
        }
        str = String(str)
        if (isNaN(length)) {
            length = 30
        }
        end = typeof end === "string" ? end : "..."
        return str.length > length ?
                str.slice(0, length - end.length) + end :/* istanbul ignore else*/
                str
    },
    camelize: avalon.camelize,
    date: date,
    escape: escape,
    sanitize: sanitize,
    number: number,
    currency: function (amount, symbol, fractionSize) {
        return (symbol || '\u00a5') +
                number(amount,
                        isFinite(fractionSize) ?/* istanbul ignore else*/ fractionSize : 2)
    }
}, arrayFilters, eventFilters)


module.exports = avalon