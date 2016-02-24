
var Cache = require("../core/cache")
//var escapeRegExp = require("../core/config").escapeRegExp
//var scanExpr = require("../scan/scanExpr")

var rexpr = avalon.config.rexpr
var quote = require("../base/builtin").quote
//function quote(a){
//    return JSON.stringify(a)
//}
function K(a) {
    return a
}

//缓存求值函数，以便多次利用
var evaluatorPool = new Cache(512)

avalon.mix({
    __read__: function (name) {
        var fn = avalon.filters[name]
        if (fn) {
            return fn.get ? fn.get : fn
        }
        return K
    },
    __write__: function (name) {
        var fn = avalon.filters[name]
        return fn && fn.set || K
    }
})
var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g
var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
var rfill = /\?\?\d+/g
var brackets = /\(([^)]*)\)/
var rAt = /(^|[^\w\u00c0-\uFFFF_])(@)(?=\w)/g
function parser(str, category) {
    category = category || "other"

    var input = str.trim()
    var cacheStr = evaluatorPool.get(category + ":" + input)
    if (cacheStr) {
        return cacheStr
    }

    var number = 1
//相同的表达式生成相同的函数
    var maps = {}
    function dig(a) {
        var key = "??" + number++
        maps[key] = a
        return key
    }

    function fill(a) {
        return maps[a]
    }

    input = input.replace(rregexp, dig).//移除所有正则
            replace(rstring, dig).//移除所有字符串
            replace(/\|\|/g, dig).//移除所有短路与
            replace(/\s*(\.|\1)\s*/g, "$1").//移除. |两端空白
            split(/\|(?=\w)/) //分离过滤器

//还原body
    var body = input.shift().replace(rfill, fill).trim().replace(rAt, "$1__vmodel__.")

//处理表达式的过滤器部分
    var filters = input.map(function (str) {

        str = str.replace(rfill, fill).replace(rAt, "$1__vmodel__.") //还原
        var hasBracket = false
        str = str.replace(brackets, function (a, b) {
            hasBracket = true
            return /\S/.test(b) ?
                    "(__value__," + b + ");" :
                    "(__value__);"
        })
        if (!hasBracket) {
            str += "(__value__);"
        }
        str = str.replace(/(\w+)/, "avalon.__read__('$1')")
        return "__value__ = " + str
    })
    var ret = [
        "(function(){",
        "try{",
        "var __value__ = " + body,
        "return __value__",
        "}catch(e){",
        "\tavalon.log(e, "+  quote('parse "'+ str+'" fail')+")",
        "\treturn ''",
        "}",
        "})()"
    ]
    
    filters.unshift(3, 0)
    ret.splice.apply(ret, filters)
    cacheStr = ret.join('\n')
    evaluatorPool.put(category + ":" + input, cacheStr)
    return cacheStr

}

module.exports = parser
//var str = parser("@aaa |upper(11)|ddd | eee")
//console.log(str)