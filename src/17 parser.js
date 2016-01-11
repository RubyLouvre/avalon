


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

function parseExpr(expr, vmodel, binding) {
    //目标生成一个函数
    binding = binding || {}

    var category = (binding.type.match(/on|duplex/) || ["other"])[0]
    var input = expr.trim()
    var watchHost = vmodel
    var fn = evaluatorPool.get(category + ":" + input)
    binding.paths = pathPool.get(category + ":" + input)
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

    //如果是通过executeBinding静态绑定的,并且不是单次绑定,并且对象是代理VM,并且表达式用到这代理VM的别名
    if (watchHost.hasOwnProperty("$repeatItem") &&
            (input.indexOf(watchHost.$repeatItem) === 0 || input === watchHost.$repeatItem)) {
        if (watchHost.$repeatObject) {
            //  console.log(expr,vm.$repeatItem,"|",vm.$id )
            //处理 ms-with的代理VM 直接回溯到顶层VM  $val.a --> obj.aa.a
            var lastIndex = watchHost.$id.lastIndexOf(".*.")
            if (lastIndex !== -1) {
                //如果这是数组循环里面的对象循环
                input = watchHost.$id.slice(lastIndex + 3)
                input = input.replace(watchHost.$key, watchHost.$repeatItem)
              
            } else {
                  console.log(input,watchHost.$id, "lastIndex")
                var arr = watchHost.$id.match(rtopsub)
                //  console.log(arr,input, watchHost.$repeatItem,watchHost)
                input = input.replace(watchHost.$repeatItem, arr[2])

                watchHost = avalon.vmodels[arr[1]]
            }

            // console.log(input, vmodel)
        } else {
            //处理 ms-each的代理VM 只回溯到数组的item VM el.a --> a

            input = input.replace(watchHost.$repeatItem + ".", "")
            watchHost = watchHost[watchHost.$repeatItem]
            //  console.log(input, watchHost.$repeatItem, watchHost)
        }
        //  binding.vmodel = vmodel
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
        console.log(fn + "")
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
