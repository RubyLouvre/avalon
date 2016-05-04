
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
        if(Number.isNaN(a) && Number.isNaN(b)){
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
    if (typeof search === 'function') {
        var criteria = search
    } else if (typeof search === 'string') {
        if(search.trim() === ''){
           criteria = function(){
               return false
           }
        }else{
           args.unshift(new RegExp(avalon.escapeRegExp(search), 'i'))
           criteria = containKey
        }
        
    } else {
        throw search + '必须是字符串或函数'
    }

    array = convertArray(array).filter(function (el) {
         return !!criteria.apply(el, [el.value].concat(args))
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
            target.push(data.hasOwnProperty(name) ? data[name] : defaults ? defaults[name]: '' )
        })
    } else {
        throw 'selectBy只支持对象'
    }
}

Number.isNaN = Number.isNaN || function(a){
    return a !== a
}

function limitBy(input, limit, begin) {
    if (Math.abs(Number(limit)) === Infinity) {
        limit = Number(limit);
    } else {
        limit = parseInt(limit,10)
    }
    if (Number.isNaN(limit))
        return input

    if (typeof input === 'number')
        input = input + ''
    if ((!Array.isArray(input)) && (typeof input !== 'string'))
        return input

    begin = (!begin || Number.isNaN(begin)) ? 0 : ~~begin
  
    
    begin = (begin < 0) ? Math.max(0, input.length + begin) : begin
    if (limit >= 0) {
        input = input.slice(begin, begin + limit)
    } else {
        if (begin === 0) {
            input = input.slice(limit, input.length)
        } else {
            input = input.slice(Math.max(0, begin + limit), begin);
        }
    }

    return recovery(input, [])
}

function recovery(ret, array, callback) {
    for (var i = 0, n = array.length; i < n; i++) {
        callback(array[i])
    }
    return ret
}

function containKey(a, reg) {
    if (avalon.isPlainObject(a)) {
        for (var k in a) {
            if (reg.test(a[k]))
                return true
        }
    } else if (Array.isArray(a)) {
        return a.some(function (b) {
            return reg.test(b)
        })
    } else if (a !== null) {
        return reg.test(a)
    }
    return false
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