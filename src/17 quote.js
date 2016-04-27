/*********************************************************************
 *                          编译系统                                  *
 **********************************************************************/

var Escapes = {
    92: "\\\\",
    34: '\\"',
    8: "\\b",
    12: "\\f",
    10: "\\n",
    13: "\\r",
    9: "\\t"
}

// Internal: Converts `value` into a zero-padded string such that its
// length is at least equal to `width`. The `width` must be <= 6.
var leadingZeroes = "000000"
var toPaddedString = function (width, value) {
    // The `|| 0` expression is necessary to work around a bug in
    // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
    return (leadingZeroes + (value || 0)).slice(-width)
};
var unicodePrefix = "\\u00"
var escapeChar = function (character) {
    var charCode = character.charCodeAt(0), escaped = Escapes[charCode]
    if (escaped) {
        return escaped
    }
    return unicodePrefix + toPaddedString(2, charCode.toString(16))
};
var reEscape = /[\x00-\x1f\x22\x5c]/g
function _quote(value) {
    reEscape.lastIndex = 0
    return '"' + ( reEscape.test(value)? String(value).replace(reEscape, escapeChar) : value ) + '"'
}

var quote = typeof JSON !== 'undefined' ? JSON.stringify : _quote