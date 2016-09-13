//avalon的核心,这里都是一些不存在异议的*核心*方法与属性
function avalon(el) {
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

var rword = /[^, ]+/g

var hasConsole = typeof console === 'object'

avalon.shadowCopy(avalon, {
    noop: function () {
    },
    version: "2.114",
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
    }

})

module.exports = avalon

new function welcome() {
    var welcomeIntro = ["%cavalon.js %c" + avalon.version + " %cin debug mode, %cmore...", "color: rgb(114, 157, 52); font-weight: normal;", "color: rgb(85, 85, 85); font-weight: normal;", "color: rgb(85, 85, 85); font-weight: normal;", "color: rgb(82, 140, 224); font-weight: normal; text-decoration: underline;"];
    var welcomeMessage = "You're running avalon in debug mode - messages will be printed to the console to help you fix problems and optimise your application.\n\n" +
            'To disable debug mode, add this line at the start of your app:\n\n  avalon.config({debug: false});\n\n' +
            'Debug mode also automatically shut down amicably when your app is minified.\n\n' +
            "Get help and support:\n  https://segmentfault.com/t/avalon\n  http://avalonjs.coding.me/\n  http://www.avalon.org.cn/\n\nFound a bug? Raise an issue:\n  https://github.com/RubyLouvre/avalon/issues\n\n";

    var con = hasConsole ? console : avalon
    var hasGroup = !!con.groupCollapsed
    con[hasGroup ? "groupCollapsed" : "log"].apply(con, welcomeIntro);
    con.log(welcomeMessage)
    if (hasGroup) {
        con.groupEnd(welcomeIntro);
    }
}
