
function orderBy(array, criteria, reverse) {
    var type = avalon.type(array)
    if (type !== 'array' && type !== 'object')
        throw 'orderBy只能处理对象或数组'
    var order = (reverse && reverse < 0) ? -1 : 1

    if (typeof criteria === 'string') {
        var key = criteria
        criteria = function (a) {
            return a && a[key]
        }
    }
    array = convertArray(array)
    array.forEach(function (el) {
        el.order = criteria(el.value, el.key)
    })
    array.sort(function (left, right) {
        var a = left.order
        var b = right.order
        if (Number.isNaN(a) && Number.isNaN(b)) {
            return 0
        }
        return a === b ? 0 : a > b ? order : -order
    })
    var isArray = type === 'array'
    var target = isArray ? [] : {}
    return recovery(target, array, function (el) {
        if (isArray) {
            target.push(el.value)
        } else {
            target[el.key] = el.value
        }
    })
}

function filterBy(array, search) {
    var type = avalon.type(array)
    if (type !== 'array' && type !== 'object')
        throw 'filterBy只能处理对象或数组'
    var args = avalon.slice(arguments, 2)
    var stype = avalon.type(search)
    if (stype === 'function') {
        var criteria = search
    } else if (stype === 'string' || stype === 'number' ) {
        if (search === '') {
            return array
        } else {
            var reg = new RegExp(avalon.escapeRegExp(search), 'i')
            criteria = function(el){
                return reg.test(el)
            }
        }
    } else {
        return array
    }

    array = convertArray(array).filter(function (el, i) {
        return !!criteria.apply(el, [el.value,i].concat(args) )
    })
    var isArray = type === 'array'
    var target = isArray ? [] : {}
    return recovery(target, array, function (el) {
        if (isArray) {
            target.push(el.value)
        } else {
            target[el.key] = el.value
        }
    })
}

function selectBy(data, array, defaults) {
    if (avalon.isObject(data) && !Array.isArray(data)) {
        var target = []
        return recovery(target, array, function (name) {
            target.push(data.hasOwnProperty(name) ? data[name] : defaults ? defaults[name] : '')
        })
    } else {
        return data
    }
}

Number.isNaN = Number.isNaN || function (a) {
    return a !== a
}

function limitBy(input, limit, begin) {
    var type = avalon.type(input)
    if (type !== 'array' && type !== 'object')
        throw 'limitBy只能处理对象或数组'
    //尝试将limit转换数值
    if (Math.abs(Number(limit)) === Infinity) {
        limit = Number(limit)
    } else {
        limit = parseInt(limit, 10)
    }
    //转换不了返回
    if (Number.isNaN(limit)) {
        return input
    }
    //将目标转换为数组
    if (type === 'object') {
        input = convertArray(input)
    }
    limit = Math.min(input.length, limit)
    begin = (!begin || Number.isNaN(begin)) ? 0 : ~~begin
    if (begin < 0) {
        begin = Math.max(0, input.length + begin)
    }

    var data = []
    for (var i = begin; i < limit; i++) {
        data.push(input[i])
    }
    var isArray = type === 'array'
    if (isArray) {
        return data
    }
    var target = {}
    return recovery(target, data, function (el) {
        target[el.key] = el.value
    })
}

function recovery(ret, array, callback) {
    for (var i = 0, n = array.length; i < n; i++) {
        callback(array[i])
    }
    return ret
}


function convertArray(array) {
    var ret = [], i = 0
    avalon.each(array, function (key, value) {
        ret[i++] = {
            value: value,
            key: key
        }
    })
    return ret
}

module.exports = {
    limitBy: limitBy,
    orderBy: orderBy,
    selectBy: selectBy,
    filterBy: filterBy
}