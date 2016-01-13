


var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g
var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
var rmethod = /\b\d+(\.\w+\s*\()/g
var keywords = [
    "break,case,catch,continue,debugger,default,delete,do,else,false",
    "finally,for,function,if,in,instanceof,new,null,return,switch,this",
    "throw,true,try,typeof,var,void,while,with", /* 关键字*/
    "abstract,boolean,byte,char,class,const,double,enum,export,extends",
    "final,float,goto,implements,import,int,interface,long,native",
    "package,private,protected,public,short,static,super,synchronized",
    "throws,transient,volatile", /*保留字*/
    "arguments,let,yield,undefined" /* ECMA 5 - use strict*/].join(",")
var rkeywords = new RegExp(["\\b" + keywords.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g')
var rpaths = /[$_a-z]\w*(\.[$_a-z]\w*)*/g
var rfilter = /^[$_a-z]\w*/
//当属性发生变化时, 执行update
var rfill = /\?\?\d+/g
var brackets = /\(([^)]*)\)/
function K(a) {
    return a
}

var pathPool = new Cache(256)
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
//avalon对于数组循环与对象循环，会将其绑定属性分别保存到watchHost与watchItem中
//watchHost为用户定义的VM，可能是顶层VM或数组item
//watchItem是循环过程中通过watchItemFactory生成的代理VM，它包含了顶层VM的所有属性，当前数组元素或键值对，
// 及el, $index, $first, $last, $val, $key等系统属性
function getWatchHost(input, watchHost, binding) {
    var toppath = input.split(".")[0]
    try {
        //调整要添加绑定对象或回调的VM
        if (watchHost.$accessors) {
            watchHost = watchHost.$accessors[toppath].get.heirloom.vm
        } else {
            watchHost = Object.getOwnPropertyDescriptor(watchHost, toppath).get.heirloom.vm
        }
    } catch (e) {
    }

    var repeatActive = String(watchHost.$active).match(/^(array|object):(\S+)/)
    if (repeatActive && (input.indexOf(repeatActive[2]) === 0 || input === repeatActive[2])) {
        var repeatItem = repeatActive[2]
        if (repeatActive[1] === "object") {
            var lastIndex = watchHost.$id.lastIndexOf(".*.")
            if (lastIndex !== -1) {
                //如果这是数组循环里面的对象循环，那么绑定数据的对象是某个数组item
                toppath = watchHost.$id.slice(0, lastIndex + 2)
                input = watchHost.$id.slice(lastIndex + 3)
                input = input.replace(repeatItem, watchHost.$key)
                for (var k in watchHost) {
                    var kv = watchHost[k]
                    if (kv && kv.$id === toppath) {
                        watchHost = kv
                        break
                    }
                }
            } else {
                //如果这是单纯的对象循环,那么绑定数据的对象是顶层VM
                var arr = watchHost.$id.match(rtopsub)
                input = input.replace(repeatItem, arr[2])
                console.log(arr)
                watchHost = avalon.vmodels[arr[1]]
            }

        } else {
            //处理 ms-each的代理VM 只回溯到数组的item VM el.a --> a
            //直接去掉前面的部分
            input = input.replace(repeatItem + ".", "")
            //还是放到ms-repeat-item的VM中
            watchHost = watchHost[repeatItem] //找到用户VM的数组元素 
        }
        binding.expr = input
    }

    binding.watchHost = watchHost
}

function parseExpr(expr, vmodel, binding) {
    //目标生成一个函数
    binding = binding || {}

    var category = (binding.type.match(/on|duplex/) || ["other"])[0]
    var input = expr.trim()
    var fn = evaluatorPool.get(category + ":" + input)
    binding.paths = pathPool.get(category + ":" + input)
    var watchHost = vmodel
    var toppath = input.split(".")[0]
    try {
        //调整要添加绑定对象或回调的VM
        if (watchHost.$accessors) {
            watchHost = watchHost.$accessors[toppath].get.heirloom.vm
        } else {
            watchHost = Object.getOwnPropertyDescriptor(watchHost, toppath).get.heirloom.vm
        }
    } catch (e) {
    }

    var repeatActive = String(watchHost.$active).match(/^(array|object):(\S+)/)
    if (repeatActive && watchHost.$watchHost) {
        var w = watchHost.$watchHost
        var repeatItem = repeatActive[2]
        if (repeatActive[1] === "object") {
            //如果这是单纯的对象循环,那么绑定数据的对象是顶层VM
            //var arr = watchHost.$id.match(rtopsub)
            //input = input.replace(repeatItem, arr[2])
            input = watchHost.$id.replace(w.$id + ".", "")
            //  watchHost = avalon.vmodels[arr[1]]
        } else {
            //watchExpr : el.aa --> aaa
            input = input.replace(repeatItem + ".", "")
            //watchHost : 总是为对象数组的某个元素
        }
        watchHost = w
        binding.expr = input
    }

    binding.watchHost = watchHost

    var canReturn = false
    if (typeof fn === "function") {
        binding.getter = fn
        canReturn = true
    }
    if (category === "duplex") {
        fn = evaluatorPool.get(category + ":" + input + ":setter")
        if (typeof fn === "function") {
            binding.setter = fn
        }
    }
    if (canReturn)
        return
    var number = 1
    //相同的表达式生成相同的函数
    var maps = {}
    function dig(a) {
        var key = "??" + number++
        maps[key] = a
        return key
    }
    function dig2(a, b) {
        var key = "??" + number++
        maps[key] = b
        return key
    }
    function fill(a) {
        return maps[a]
    }

    input = input.replace(rregexp, dig).//移除所有正则
            replace(rstring, dig).//移除所有字符串
            replace(rmethod, dig2).//移除所有正则或字符串方法
            replace(/\|\|/g, dig).//移除所有短路与
            replace(/\$event/g, dig).//去掉事件对象
            replace(/\s*(\.|\1)\s*/g, "$1").//移除. |两端空白
            split(/\|(?=\w)/) //分离过滤器
    var paths = {}
    //处理表达式的本体
    var body = input.shift().
            replace(rkeywords, dig).
            replace(rpaths, function (a) {
                paths[a] = true //抽取所有要$watch的东西
                return a
            })
    //处理表达式的过滤器部分
    var footers = input.map(function (str) {
        return str.replace(/\w+/, dig).//去掉过滤名
                replace(rkeywords, dig).//去掉关键字
                replace(rpaths, function (a) {
                    paths[a] = true //抽取所有要$watch的东西
                    return a
                })
    }).map(function (str) {
        str = str.replace(rfill, fill) //还原
        var hasBracket = false
        str = str.replace(brackets, function (a, b) {
            hasBracket = true
            return /\S/.test(b) ?
                    "(__value__," + b + ");\n" :
                    "(__value__);\n"
        })
        if (!hasBracket) {
            str += "(__value__);\n"
        }
        str = str.replace(/(\w+)/, "avalon.__read__('$1')")
        return "__value__ = " + str
    })
    var eventFilters = []
    if (category === "on") {
        eventFilters = footers.map(function (el) {
            return  el.replace(/__value__/g, "$event")
        })
        if (eventFilters.length) {
            eventFilters.push("if($event.$return){\n\treturn;\n}\n")
        }
        footers = []
    }

    var headers = []
    var unique = {}
    var pathArray = []
    for (var i in paths) {
        pathArray.push(i)
        if (!unique[i]) {
            var key = i.split(".").shift()
            unique[key] = true
            headers.push("var " + key + " =  __vm__." + key + ";\n")
        }
    }
    binding.paths = pathPool.put(category + ":" + input,
            pathArray.join("★"))
    body = body.replace(rfill, fill).trim()
    var args = ["__vm__"]
    if (category === "on") {
        args = ["$event", "__vm__"]
        if (body.indexOf("(") === -1) {//如果不存在括号
            body += ".call(this, $event)"
        } else {
            body = body.replace(brackets, function (a, b) {
                var array = b.split(/\s*,\s*/).filter(function (e) {
                    return /\S/.test(e)
                })
                array.unshift("this")
                if (array.indexOf("$event") === -1) {
                    array.push("$event")
                }
                return  ".call(" + array + ")"
            })
        }

    } else if (category === "duplex") {
        args.push("__value__", "__bind__")
        //Setter
        var setters = footers.map(function (str) {
            str = str.replace("__read__", "__write__")
            return str.replace(");", ",__bind__);")
        })
        //Getter
        footers = footers.map(function (str) {
            return str.replace(");", ",__bind__);")
        })
        fn = new Function(args.join(","),
                setters.join("") +
                "__vm__." + body + " = __value__;")
        binding.setter = evaluatorPool.put(category +
                ":" + input + ":setter", fn)
    }
    headers.push(eventFilters.join(""))
    headers.push("var __value__ = " + body + ";\n")
    headers.push.apply(headers, footers)
    headers.push("return __value__;")

    try {
        fn = new Function(args.join(","), headers.join(""))
    } catch (e) {
        avalon.log(expr + " convert to\n function( " + args + "){\n" +
                headers.join("") + "}\n fail")
    }

    if (category === "on") {
        var old = fn
        fn = function () {
            return old
        }
    }
    binding.getter = evaluatorPool.put(category + ":" + input, fn)
}


function normalizeExpr(code) {
    var hasExpr = rexpr.test(code) //比如ms-class="width{{w}}"的情况
    if (hasExpr) {
        var array = scanExpr(code)
        if (array.length === 1) {
            return array[0].expr
        }
        /* jshint ignore:start */
        return array.map(function (el) {
            return el.type ? "(" + el.expr + ")" : quote(el.expr)
        }).join(" + ")
        /* jshint ignore:end */
    } else {
        return code
    }
}
avalon.normalizeExpr = normalizeExpr
avalon.parseExprProxy = parseExpr //兼容老版本
