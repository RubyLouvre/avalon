/* 
 * 将要检测的字符串的字符串替换成??123这样的格式
 */
export var stringNum = 0
export var stringPool = {
    map: {}
}
export var rfill = /\?\?\d+/g
export function dig(a) {
    var key = '??' + stringNum++
    stringPool.map[key] = a
    return key + ' '
}
export function fill(a) {
    var val = stringPool.map[a]
    return val
}
export function clearString(str) {
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
            if (c === end) {
                ret.push(str.slice(s, i + 1))
                end = false
            }
        }
    }
    return ret
}
