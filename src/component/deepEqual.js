module.exports = deepEqual

var deepDetectType = {
    object: 1,
    array: 1,
}
var toStringType = {
    date: 1,
    regexp: 1,
    'function': 1
}
function deepEqual(a, b, m) {
    if (sameValue(a, b)) {//防止出现NaN的情况
        return true
    }
    var atype = avalon.type(a)
    var btype = avalon.type(b)

    if (atype !== btype) {//如果类型不相同
        return false
    } else if (toStringType[atype]) {
        return a + '' === b + ''
    } else if (deepDetectType[atype]) {
        return objectEqual(a, b, m)
    } else {
        return false
    }
}

var sameValue = Object.is || function (a, b) {
    if (a === b)
        return a !== 0 || 1 / a === 1 / b
    return a !== a && b !== b
}


function enumerable(a) {
    var res = []
    for (var key in a)
        res.push(key)
    return res
}

function iterableEqual(a, b) {
    if (a.length !== b.length)
        return false

    var i = 0
    var match = true

    for (; i < a.length; i++) {
        if (a[i] !== b[i]) {
            match = false
            break
        }
    }

    return match
}

function isValue(a) {
    return a !== null && a !== undefined
}

function objectEqual(a, b, m) {
    if (!isValue(a) || !isValue(b)) {
        return false
    }

    if (a.prototype !== b.prototype) {
        return false
    }

    var i
    if (m) {
        for (i = 0; i < m.length; i++) {
            if ((m[i][0] === a && m[i][1] === b)
                    || (m[i][0] === b && m[i][1] === a)) {
                return true
            }
        }
    } else {
        m = []
    }

    try {
        var ka = enumerable(a)
        var kb = enumerable(b)
    } catch (ex) {
        return false
    }

    ka.sort()
    kb.sort()

    if (!iterableEqual(ka, kb)) {
        return false
    }

    m.push([a, b])

    var key
    for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i]
        if (!deepEqual(a[key], b[key], m)) {
            return false
        }
    }

    return true
}
