//avalon的核心,这里都是一些不存在异议的*核心*方法与属性
export default function avalon(el) {
        return new avalon.init(el)
}

avalon.init = function (el) {
        this[0] = this.element = el
}

avalon.fn = avalon.prototype = avalon.init.prototype

avalon.shadowCopy = function (destination, source) {
        for (var property in source) {
                destination[property] = source[property]
        }
        return destination
}
var cssHooks = {}
var rhyphen = /([a-z\d])([A-Z]+)/g
var rcamelize = /[-_][^-_]/g
var rhashcode = /\d\.\d{4}/
var rescape = /[-.*+?^${}()|[\]\/\\]/g

var _slice = [].slice
function defaultParse(cur, pre, binding) {
        cur[binding.name] = avalon.parseExpr(binding)
}
var rword = /[^, ]+/g

var hasConsole = typeof console === 'object'

avalon.shadowCopy(avalon, {
        noop: function () {
        },
        version: "2.115",
        //切割字符串为一个个小块，以空格或逗号分开它们，结合replace实现字符串的forEach
        rword: rword,
        inspect: ({}).toString,
        ohasOwn: ({}).hasOwnProperty,
        caches: {}, //avalon2.0 新增
        vmodels: {},
        filters: {},
        components: {}, //放置组件的类
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
                        if (a === '')
                                return a
                        return a === 'true' || a == '1'
                }
        },
        log: function () {
                if (hasConsole && avalon.config.debug) {
                        // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
                        Function.apply.call(console.log, console, arguments)
                }
        },
        warn: function () {
                /* istanbul ignore if*/
                if (hasConsole && avalon.config.debug) {
                        var method = console.warn || console.log
                        // http://qiang106.iteye.com/blog/1721425
                        Function.apply.call(method, console, arguments)
                }
        },
        error: function (str, e) {
                throw (e || Error)(str)
        },
        //将一个以空格或逗号隔开的字符串或数组,转换成一个键值都为1的对象
        oneObject: function (array, val) {
                /* istanbul ignore if*/
                if (typeof array === 'string') {
                        array = array.match(rword) || []
                }
                var result = {},
                        value = val !== void 0 ? val : 1
                for (var i = 0, n = array.length; i < n; i++) {
                        result[array[i]] = value
                }
                return result
        },
        isObject: function (a) {
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
                var index = - 1,
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
        slice: function (nodes, start, end) {
                return _slice.call(nodes, start, end)
        },
        css: function (node, name, value, fn) {
                //读写删除元素节点的样式
                if (node instanceof avalon) {
                        node = node[0]
                }
                if (node.nodeType !== 1) {
                        return
                }
                var prop = avalon.camelize(name)
                name = avalon.cssName(prop) || /* istanbul ignore next*/ prop
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
                definition.parse = definition.parse || /* istanbul ignore next*/ defaultParse
                return this.directives[name] = definition
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
                        if (target.indexOf(item) === - 1) {
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

