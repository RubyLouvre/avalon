var cssHooks = {}
var rhyphen = /([a-z\d])([A-Z]+)/g
var rcamelize = /[-_][^-_]/g
var rhashcode = /\d\.\d{4}/
var rescape = /[-.*+?^${}()|[\]\/\\]/g

var _slice = [].slice
function defaultParse(cur, pre, binding) {
       cur[binding.name] = avalon.parseExpr(binding)
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
            return a === '' ? '' : /\d\.$/.test(a) ? a : parseFloat(a) || 0
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
    version: "2.10",
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
        name = avalon.cssName(prop) || prop
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
        definition.parse = definition.parse || defaultParse
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
        prefix = prefix || 'avalon'
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

if(typeof performance !== 'undefined' && performance.now){
    avalon.makeHashCode = function (prefix) {
        prefix = prefix || 'avalon'
        return (prefix + performance.now()).replace('.', '')
    }
}

var UUID = 1
module.exports = {
    //生成事件回调的UUID(用户通过ms-on指令)
    avalon: avalon,
    getLongID: function (fn) {
        return fn.uuid || (fn.uuid = avalon.makeHashCode('e'))
    },
    //生成事件回调的UUID(用户通过avalon.bind)
    getShortID: function (fn) {
        return fn.uuid || (fn.uuid = '_' + (++UUID))
    }
}
