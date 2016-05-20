//avalon的核心,这里都是一些不存在异议的*核心*方法与属性
function avalon(el) {
    return new avalon.init(el)
}

global.avalon = avalon
if(typeof window !== 'undefined'){
    window.avalon = avalon
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

var rword = /[^, ]+/g

var hasConsole = global.console

avalon.shadowCopy(avalon, {
    noop: function () {
    },
    //切割字符串为一个个小块，以空格或逗号分开它们，结合replace实现字符串的forEach
    rword: rword,
    inspect: ({}).toString,
    ohasOwn: ({}).hasOwnProperty,
    log: function () {
        if (hasConsole && avalon.config.debug) {
            // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
            Function.apply.call(console.log, console, arguments)
        }
    },
    warn: function () {
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
        if (typeof array === 'string') {
            array = array.match(rword) || []
        }
        var result = {},
                value = val !== void 0 ? val : 1
        for (var i = 0, n = array.length; i < n; i++) {
            result[array[i]] = value
        }
        return result
    }

})

module.exports = avalon