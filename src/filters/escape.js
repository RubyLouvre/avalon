
var rsurrogate = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g
var rnoalphanumeric = /([^\#-~| |!])/g

function escape(str) {
    //将字符串经过 str 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt 
    return String(str).
            replace(/&/g, '&amp;').
            replace(rsurrogate, function (value) {
                var hi = value.charCodeAt(0)
                var low = value.charCodeAt(1)
                return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';'
            }).
            replace(rnoalphanumeric, function (value) {
                return '&#' + value.charCodeAt(0) + ';'
            }).
            replace(/</g, '&lt;').
            replace(/>/g, '&gt;')
}

module.exports = escape