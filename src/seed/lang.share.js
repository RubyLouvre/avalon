var avalon = require('./core')
var cssHooks = {}
var rhyphen = /([a-z\d])([A-Z]+)/g
var rcamelize = /[-_][^-_]/g
var rhashcode = /\d\.\d{4}/
var rescape = /[-.*+?^${}()|[\]\/\\]/g
var Cache = require('./cache')
//缓存求值函数，以便多次利用
avalon.evaluatorPool = new Cache(888)

var _slice = [].slice
function defaultParse(cur, pre, binding) {
    cur[binding.name] = avalon.parseExpr(binding)
}

/* 
 * 对html实体进行转义
 * https://github.com/substack/node-ent
 * http://www.cnblogs.com/xdp-gacl/p/3722642.html
 * http://www.stefankrause.net/js-frameworks-benchmark2/webdriver-java/table.html
 */

var rentities = /&[a-z0-9#]{2,10};/
var temp = avalon.avalonDiv
avalon._decode = function (str) {
    if (rentities.test(str)) {
        temp.innerHTML = str
        return temp.innerText || temp.textContent
    }
    return str
}
avalon.shadowCopy(avalon, {
    caches: {}, //avalon2.0 新增
    vmodels: {},
    filters: {},
    components: {},//放置组件的类
    directives: {},
    eventHooks: {},
    eventListeners: {},
    validators: {},
    scopes: {},
    cssHooks: cssHooks,
    parsers: {
        number: function (a) {
            return a === '' ? '' : parseFloat(a) || 0
        },
        string: function (a) {
            return a === null || a === void 0 ? '' : a + ''
        },
        boolean: function (a) {
            if(a === '')
                return a
            return a === 'true'|| a == '1' 
        }
    },
    version: "2.114",
    isEmptyObject: function(obj){
        for(var i in obj){
            return false
        }
        return true
    },
    slice: function (nodes, start, end) {
        return _slice.call(nodes, start, end)
    },
    css: function (node, name, value, fn) {
        //读写删除元素节点的样式
        if (node instanceof avalon) {
            node = node[0]
        }
        if(node.nodeType !==1){
            return
        }
        var prop = avalon.camelize(name)
        name = avalon.cssName(prop) ||  /* istanbul ignore next*/ prop
        if (value === void 0 || typeof value === 'boolean') { //获取样式
            fn = cssHooks[prop + ':get'] || cssHooks['@:get']
            if (name === 'background') {
                name = 'backgroundColor'
            }
            var val = fn(node, name)
            return value === true ? parseFloat(val) || 0 : val
        } else if (value === '') { //请除样式
            node.style[name] = ''
        } else { //设置样式
            if (value == null || value !== value) {
                return
            }
            if (isFinite(value) && !avalon.cssNumber[prop]) {
                value += 'px'
            }
            fn = cssHooks[prop + ':set'] || cssHooks['@:set']
            fn(node, name, value)
        }
    },
    directive: function (name, definition) {
        definition.parse = definition.parse ||/* istanbul ignore next*/ defaultParse
        return this.directives[name] = definition
    },
    isObject: function (a) {//1.6新增
        return a !== null && typeof a === 'object'
    },
    /* avalon.range(10)
     => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     avalon.range(1, 11)
     => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     avalon.range(0, 30, 5)
     => [0, 5, 10, 15, 20, 25]
     avalon.range(0, -10, -1)
     => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
     avalon.range(0)
     => []*/
    range: function (start, end, step) { // 用于生成整数数组
        step || (step = 1)
        if (end == null) {
            end = start || 0
            start = 0
        }
        var index = -1,
                length = Math.max(0, Math.ceil((end - start) / step)),
                result = new Array(length)
        while (++index < length) {
            result[index] = start
            start += step
        }
        return result
    },
    hyphen: function (target) {
        //转换为连字符线风格
        return target.replace(rhyphen, '$1-$2').toLowerCase()
    },
    camelize: function (target) {
        //提前判断，提高getStyle等的效率
        if (!target || target.indexOf('-') < 0 && target.indexOf('_') < 0) {
            return target
        }
        //转换为驼峰风格
        return target.replace(rcamelize, function (match) {
            return match.charAt(1).toUpperCase()
        })
    },
    //生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    makeHashCode: function (prefix) {
       /* istanbul ignore next*/
        prefix = prefix || 'avalon'
        /* istanbul ignore next*/
        return String(Math.random() + Math.random()).replace(rhashcode, prefix)
    },
    escapeRegExp: function (target) {
        //http://stevenlevithan.com/regex/xregexp/
        //将字符串安全格式化为正则表达式的源码
        return (target + '').replace(rescape, '\\$&')
    },
    Array: {
        merge: function (target, other) {
            //合并两个数组 avalon2新增
            target.push.apply(target, other)
        },
        ensure: function (target, item) {
            //只有当前数组不存在此元素时只添加它
            if (target.indexOf(item) === -1) {
                return target.push(item)
            }
        },
        removeAt: function (target, index) {
            //移除数组中指定位置的元素，返回布尔表示成功与否
            return !!target.splice(index, 1).length
        },
        remove: function (target, item) {
            //移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否
            var index = target.indexOf(item)
            if (~index)
                return avalon.Array.removeAt(target, index)
            return false
        }
    }
})
/* istanbul ignore if*/
if(typeof performance !== 'undefined' && performance.now){
    avalon.makeHashCode = function (prefix) {
        prefix = prefix || 'avalon'
        return (prefix + performance.now()).replace('.', '')
    }
}

var UUID = 1
 //如果是使用ms-on-*绑定的回调,其uuid格式为e12122324
 // fn.uuid = fn.uuid || avalon.makeHashCode(e)
 //如果是使用bind方法绑定的回调,其uuid格式为_12
avalon._markBindID = function(){
    /* istanbul ignore next */
        return fn.uuid || (fn.uuid = '_' + (++UUID))
}

//=====================
avalon._deepEqual = deepEqual

var typeMap = {
    object: 1,
    array: 1
}
function deepEqual(a, b, m) {
    if (sameValue(a, b)) {//防止出现NaN的情况
        return true
    }
    var atype = type(a)
    var btype = type(b)
    if ('date' === atype) {
        return dateEqual(a, b, btype)
    } else if ('regexp' === atype) {
        return regexpEqual(a, b, btype)
    } else if (atype !== b.type) {//如果类型不相同
        return false
    } else if (!typeMap[atype]) {
        return false
    } else {
        return objectEqual(a, b, m)
    }
}


var sameValue = Object.is || function (a, b) {
    if (a === b)
        return a !== 0 || 1 / a === 1 / b
    return a !== a && b !== b
}


function dateEqual(a, b, btype) {
    if ('date' !== btype)
        return false
    return a.getTime() === b.getTime()
}


function regexpEqual(a, b, btype) {
    if ('regexp' !== btype)
        return false
    return a.toString() === b.toString()
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
