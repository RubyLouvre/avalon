var camelize = require("../base/builtin").camelize

var number = require("./number")
var escape = require("./escape")
var sanitize = require("./sanitize")
var date = require("./date")
var arrayFilters = require("./array")
var eventFilters = require("./event")

var filters = avalon.filters

avalon.mix(filters, {
    uppercase: function (str) {
        return str.toUpperCase()
    },
    lowercase: function (str) {
        return str.toLowerCase()
    },
    truncate: function (str, length, truncation) {
        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        length = length || 30
        truncation = typeof truncation === "string" ? truncation : "..."
        return str.length > length ?
                str.slice(0, length - truncation.length) + truncation :
                String(str)
    },
    camelize: camelize,
    number: number,
    date: date,
    escape: escape,
    sanitize: sanitize,
    currency: function (amount, symbol, fractionSize) {
        return (symbol || "\uFFE5") +
                number(amount,
                        isFinite(fractionSize) ? fractionSize : 2)
    }
}, arrayFilters, eventFilters)



function fixNull(val) {
    return val == null ? "" : val
}
avalon.mix(avalon.filters, {
    checked: {
        get: function (val, elem) {
            return !elem.oldValue
        }
    },
    string: {//转换为字符串或,字符串数组
        get: function (val) { //同步到VM
            return val == null ? "" : val + ""
        },
        set: fixNull
    },
    boolean: {
        get: function (val) {
            return val === "true"
        },
        set: fixNull
    },
    numeric: {
        get: function (val, elem) {
            var number = parseFloat(val + "")
            if (number !== number) {
                var arr = /strong|medium|weak/.exec(elem.getAttribute("data-duplex-number")) || ["medium"]
                switch (arr[0]) {
                    case "strong":
                        return 0
                    case "medium":
                        return val === "" ? "" : 0
                    case "weak":
                        return val
                }
            } else {
                return number
            }
        },
        set: fixNull
    }
})

