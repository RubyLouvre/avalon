/* 
 * 将要检测的字符串的字符串替换成??123这样的格式
 */


module.exports = clearString
function clearString(str, dig) {
    var array = readString(str)
    for (var i = 0, n = array.length; i < n; i++) {
        str = str.replace(array[i], dig)
    }
    return str
}

function readString(str) {
    var end, s = 0
    var ret = []
    for (var i = 0, n = str.length; i < n; i++) {
        var c = str.charAt(i)
        if (!end) {
            if (c === "'") {
                end = "'"
                s = i
            } else if (c === '"') {
                end = '"'
                s = i
            }
        } else {
            if (c === '\\') {
                i += 1
                continue
            }
            if (c === end) {
                ret.push(str.slice(s, i + 1))
                end = false
            }
        }
    }
    return ret
}