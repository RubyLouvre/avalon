
var number = require("./number")
var escape = require("./escape")
var sanitize = require("./sanitize")
var date = require("./date")
var arrayFilters = require("./array")
var eventFilters = require("./event")
var filters = avalon.filters

function K(a) {
    return a
}

avalon.__format__ = function (name) {
    var fn = filters[name]
    if (fn) {
        return fn.get ? fn.get : fn
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
    truncate: function (str, length, truncation) {
        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        length = length || 30
        truncation = typeof truncation === "string" ? truncation : "..."
        return str.length > length ?
                str.slice(0, length - truncation.length) + truncation :
                String(str)
    },
    camelize: avalon.camelize,
    date: date,
    escape: escape,
    sanitize: sanitize,
    number: number,
    currency: function (amount, symbol, fractionSize) {
        return (symbol || "\uFFE5") +
                number(amount,
                        isFinite(fractionSize) ? fractionSize : 2)
    }
}, arrayFilters, eventFilters)







module.exports = avalon