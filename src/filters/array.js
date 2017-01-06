import { avalon } from '../seed/core'
import { $$skipArray } from '../vmodel/reserved'

/*
https://github.com/hufyhang/orderBy/blob/master/index.js
*/

export function orderBy(array, by, decend) {
    var type = avalon.type(array)
    if (type !== 'array' && type !== 'object')
        throw 'orderBy只能处理对象或数组'
    var criteria = typeof by == 'string' ? function(el) {
        return el && el[by]
    } : typeof by === 'function' ? by : function(el) {
        return el
    }
    var mapping = {}
    var temp = []
    __repeat(array, Array.isArray(array), function(key) {
        var val = array[key]
        var k = criteria(val, key)
        if (k in mapping) {
            mapping[k].push(key)
        } else {
            mapping[k] = [key]
        }
        temp.push(k)
    })

    temp.sort()
    if (decend < 0) {
        temp.reverse()
    }
    var _array = type === 'array'
    var target = _array ? [] : {}
    return recovery(target, temp, function(k) {
        var key = mapping[k].shift()
        if (_array) {
            target.push(array[key])
        } else {
            target[key] = array[key]
        }
    })
}

function __repeat(array, isArray, cb) {
    if (isArray) {
        array.forEach(function(val, index) {
            cb(index)
        })
    } else if (typeof array.$track === 'string') {
        array.$track.replace(/[^☥]+/g, function(k) {
            cb(k)
        })
    } else {
        for (var i in array) {
            if (array.hasOwnProperty(i)) {
                cb(i)
            }
        }
    }
}
export function filterBy(array, search) {
    var type = avalon.type(array)
    if (type !== 'array' && type !== 'object')
        throw 'filterBy只能处理对象或数组'
    var args = avalon.slice(arguments, 2)
    var stype = avalon.type(search)
    if (stype === 'function') {
        var criteria = search._orig || search
    } else if (stype === 'string' || stype === 'number') {
        if (search === '') {
            return array
        } else {
            var reg = new RegExp(avalon.escapeRegExp(search), 'i')
            criteria = function(el) {
                return reg.test(el)
            }
        }
    } else {
        return array
    }
    var isArray = type === 'array'
    var target = isArray ? [] : {}
    __repeat(array, isArray, function(key) {
        var val = array[key]
        if (criteria.apply({
            key: key
        }, [val, key].concat(args))) {
            if (isArray) {
                target.push(val)
            } else {
                target[key] = val
            }
        }
    })
    return target
}

export function selectBy(data, array, defaults) {
    if (avalon.isObject(data) && !Array.isArray(data)) {
        var target = []
        return recovery(target, array, function(name) {
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
        input = convertArray(input, false)
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
    return recovery(target, data, function(el) {
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
function convertArray(array, isArray) {
    var ret = [],
        i = 0
    __repeat(array, isArray, function(key) {
        ret[i] = {
            oldIndex: i,
            value: array[key],
            key: key
        }
        i++
    })
    return ret
}