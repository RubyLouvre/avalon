import {avalon} from '../seed/core'

import numberFilter from "./number"
import sanitizeFilter from "./sanitize"
import dateFilter from "./date"
import {limitBy, filterBy, selectBy, orderBy} from "./array"
import eventFilters from "./event"
import escapeFilter from "./escape"

var filters = avalon.filters


avalon.escapeHtml = escapeFilter

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
    date: dateFilter,
    escape: escapeFilter,
    sanitize: sanitizeFilter,
    number: numberFilter,
    currency: function (amount, symbol, fractionSize) {
        return (symbol || '\u00a5') +
            numberFilter(amount,
                isFinite(fractionSize) ?/* istanbul ignore else*/ fractionSize : 2)
    }
}, {limitBy, filterBy, selectBy, orderBy}, eventFilters)


