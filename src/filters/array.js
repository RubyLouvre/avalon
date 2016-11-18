import { avalon } from '../seed/core'
/*
https://github.com/hufyhang/orderBy/blob/master/index.js
*/

export function orderBy(array, by, decend) {
    var type = avalon.type(array)
    if (type !== 'array' && type !== 'object')
        throw 'orderBy只能处理对象或数组'
    var criteria = typeof by == 'string' ? function (el) {
        return el && el[by]
    } : typeof by === 'function' ? by : function (el) {
        return el
    }
    var mapping = {}
    var temp = []
    var index = 0
    for (var key in array) {
        if (array.hasOwnProperty(key)) {
            var val = array[key]
            var k = criteria(val, key)
            if (k in mapping) {
                mapping[k].push(key)
            } else {
                mapping[k] = [key]
            }

            temp.push(k)
        }
    }

    temp.sort()
    if (decend < 0) {
        temp.reverse()
    }
    var _array = type === 'array'
    var target = _array ? [] : {}
    return recovery(target, temp, function (k) {
        var key = mapping[k].shift()
        if (_array) {
            target.push(array[key])
        } else {
            target[key] = array[key]
        }
    })
}
export function filterBy(array, search) {
    var type = avalon.type(array)
    if (type !== 'array' && type !== 'object')
        throw 'filterBy只能处理对象或数组'
    var args = avalon.slice(arguments, 2)
    var stype = avalon.type(search)
    if (stype === 'function') {
        var criteria = search
    } else if (stype === 'string' || stype === 'number') {
        if (search === '') {
            return array
        } else {
            var reg = new RegExp(avalon.escapeRegExp(search), 'i')
            criteria = function (el) {
                return reg.test(el)
            }
        }
    } else {
        return array
    }

    array = convertArray(array).filter(function (el, i) {
        return !!criteria.apply(el, [el.value, i].concat(args))
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

export function selectBy(data, array, defaults) {
    if (avalon.isObject(data) && !Array.isArray(data)) {
        var target = []
        return recovery(target, array, function (name) {
            target.push(data.hasOwnProperty(name) ? data[name] : defaults ? defaults[name] : '')
        })
    } else {
        return data
    }
}

export function limitBy(input, limit, begin) {
    var type = avalon.type(input)
    if (type !== 'array' && type !== 'object')
        throw 'limitBy只能处理对象或数组'
    //必须是数值
    if (typeof limit !== 'number') {
        return input
    }
    //不能为NaN
    if (limit !== limit) {
        return input
    }
    //将目标转换为数组
    if (type === 'object') {
        input = convertArray(input)
    }
    var n = input.length
    limit = Math.floor(Math.min(n, limit))
    begin = typeof begin === 'number' ? begin : 0
    if (begin < 0) {
        begin = Math.max(0, n + begin)
    }
    var data = []
    for (var i = begin; i < n; i++) {
        if (data.length === limit) {
            break
        }
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

//Chrome谷歌浏览器中js代码Array.sort排序的bug乱序解决办法
//http://www.cnblogs.com/yzeng/p/3949182.html
function convertArray(array) {
    var ret = [], i = 0
    for (var key in array) {
        if (array.hasOwnProperty(key)) {
            ret[i] = {
                oldIndex: i,
                value: array[key],
                key: key
            }
            i++
        }
    }
    return ret
}
