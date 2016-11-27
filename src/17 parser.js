var keyMap = {}
var keys = ["break,case,catch,continue,debugger,default,delete,do,else,false",
    "finally,for,function,if,in,instanceof,new,null,return,switch,this",
    "throw,true,try,typeof,var,void,while,with", /* 关键字*/
    "abstract,boolean,byte,char,class,const,double,enum,export,extends",
    "final,float,goto,implements,import,int,interface,long,native",
    "package,private,protected,public,short,static,super,synchronized",
    "throws,transient,volatile", /*保留字*/
    "arguments,let,yield,undefined"].join(",")
keys.replace(/\w+/g, function (a) {
    keyMap[a] = true
})

var ridentStart = /[a-z_$]/i
var rwhiteSpace = /[\s\uFEFF\xA0]/
function getIdent(input, lastIndex) {
    var result = []
    var subroutine = !!lastIndex
    lastIndex = lastIndex || 0
    //将表达式中的标识符抽取出来
    var state = "unknown"
    var variable = ""
    for (var i = 0; i < input.length; i++) {
        var c = input.charAt(i)
        if (c === "'" || c === '"') {//字符串开始
            if (state === "unknown") {
                state = c
            } else if (state === c) {//字符串结束
                state = "unknown"
            }
        } else if (c === "\\") {
            if (state === "'" || state === '"') {
                i++
            }
        } else if (ridentStart.test(c)) {//碰到标识符
            if (state === "unknown") {
                state = "variable"
                variable = c
            } else if (state === "maybePath") {
                variable = result.pop()
                variable += "." + c
                state = "variable"
            } else if (state === "variable") {
                variable += c
            }
        } else if (/\w/.test(c)) {
            if (state === "variable") {
                variable += c
            }
        } else if (c === ".") {
            if (state === "variable") {
                if (variable) {
                    result.push(variable)
                    variable = ""
                    state = "maybePath"
                }
            }
        } else if (c === "[") {
            if (state === "variable" || state === "maybePath") {
                if (variable) {//如果前面存在变量,收集它
                    result.push(variable)
                    variable = ""
                }
                var lastLength = result.length
                var last = result[lastLength - 1]
                var innerResult = getIdent(input.slice(i), i)
                if (innerResult.length) {//如果括号中存在变量,那么这里添加通配符
                    result[lastLength - 1] = last + ".*"
                    result = innerResult.concat(result)
                } else { //如果括号中的东西是确定的,直接转换为其子属性
                    var content = input.slice(i + 1, innerResult.i)
                    try {
                        var text = (scpCompile(["return " + content]))()
                        result[lastLength - 1] = last + "[" + text + "]"
                    } catch (e) {
                    }
                }
                state = "maybePath"//]后面可能还接东西
                i = innerResult.i
            }
        } else if (c === "]") {
            if (subroutine) {
                result.i = i + lastIndex
                addVar(result, variable)
                return result
            }
        } else if (rwhiteSpace.test(c) && c !== "\r" && c !== "\n") {
            if (state === "variable") {
                if (addVar(result, variable)) {
                    state = "maybePath" // aaa . bbb 这样的情况
                }
                variable = ""
            }
        } else {
            addVar(result, variable)
            state = "unknown"
            variable = ""
        }
    }
    addVar(result, variable)
    return result
}

function addVar(array, element) {
    if (element && !keyMap[element]) {
        array.push(element)
        return true
    }
}

function addAssign(vars, vmodel, name, binding) {
    var ret = [],
            prefix = " = " + name + "."
    for (var i = vars.length, prop; prop = vars[--i]; ) {
        
        //修改prop格式： arr[0].pro1 ==> arr.0.pro1,
        var arr, a ,oldprop = prop
        if( prop.indexOf('[') >= 0 ){
            prop = prop.replace('[','.').replace(']','')
        }
        arr = prop.split(".")
        var first = arr[0]
        while (a = arr.shift()) {
            if (vmodel.hasOwnProperty(a)) {
                ret.push(first + prefix + first)
                
                //bugfix:https://github.com/RubyLouvre/avalon/issues/1682
                //对于由于expr中可能存在不可达的语句如：j5son[0].cn1 ==='' || j5son[0].cn2 ===''造成当cn2改变时dom未修改
                //解决办法：对于vars数组里的所有变量，都取一次值，保证可以触发依赖收集。但不影响表达式的结果
                
                //bugfix:https://github.com/RubyLouvre/avalon/issues/1742
                //考虑如果绑定表达式中包含变量，会生成'obj.*.property'这样的表达式
                //会造成var x = obj.*.property;语句编译失败。
                
                //表达式中包含变量的不生成附值语句
                if(oldprop.indexOf('.*')<0)
                    ret.push(generateID('_nousevar_' + i) + ' = '+ oldprop)
                
                binding.observers.push({
                    v: vmodel,
                    p: prop
                })
                vars.splice(i, 1)
            } else {
                break
            }
        }
    }
    return ret
}

var rproxy = /(\$proxy\$[a-z]+)\d+$/
var variablePool = new Cache(218)
//缓存求值函数，以便多次利用
var evaluatorPool = new Cache(128)

function getVars(expr) {
    expr = expr.trim()
    var ret = variablePool.get(expr)
    if (ret) {
        return ret.concat()
    }
    var array = getIdent(expr)
    var uniq = {}
    var result = []
    for (var i = 0, el; el = array[i++]; ) {
        if (!uniq[el]) {
            uniq[el] = 1
            result.push(el)
        }
    }
    return variablePool.put(expr, result).concat()
}

function parseExpr(expr, vmodels, binding) {
    var filters = binding.filters
    if (typeof filters === "string" && filters.trim() && !binding._filters) {
        binding._filters = parseFilter(filters.trim())
    }

    var vars = getVars(expr)
    var expose = new Date() - 0
    var assigns = []
    var names = []
    var args = []
    binding.observers = []
    for (var i = 0, sn = vmodels.length; i < sn; i++) {
        if (vars.length) {
            var name = "vm" + expose + "_" + i
            names.push(name)
            args.push(vmodels[i])
            assigns.push.apply(assigns, addAssign(vars, vmodels[i], name, binding))
        }
    }
    binding.args = args
    var dataType = binding.type
    var exprId = vmodels.map(function (el) {
        return String(el.$id).replace(rproxy, "$1")
    }) + expr + dataType
    var getter = evaluatorPool.get(exprId) //直接从缓存，免得重复生成
    if (getter) {
        binding.getter = getter
        // https://github.com/RubyLouvre/avalon/issues/1833
        if (dataType === "duplex") {
            var setter = evaluatorPool.get(exprId + "setter")
            if(setter){
               binding.setter = setter.apply(setter, binding.args)
               return getter
            }    
        }else{
            return  getter
        }
    }

    if (!assigns.length) {
        assigns.push("fix" + expose)
    }

    if (dataType === "duplex") {
        var nameOne = {}
        assigns.forEach(function (a) {
            var arr = a.split("=")
            nameOne[arr[0].trim()] = arr[1].trim()
        })
        expr = expr.replace(/[\$\w]+/, function (a) {
            return nameOne[a] ? nameOne[a] : a
        })
        /* jshint ignore:start */
        var fn2 = scpCompile(names.concat("'use strict';" +
                "return function(vvv){" + expr + " = vvv\n}\n"))
        /* jshint ignore:end */
        evaluatorPool.put(exprId + "setter", fn2)
        binding.setter = fn2.apply(fn2, binding.args)
    }

    if (dataType === "on") { //事件绑定
        if (expr.indexOf("(") === -1) {
            expr += ".call(this, $event)"
        } else {
            expr = expr.replace("(", ".call(this,")
        }
        names.push("$event")
        expr = "\nreturn " + expr + ";" //IE全家 Function("return ")出错，需要Function("return ;")
        var lastIndex = expr.lastIndexOf("\nreturn")
        var header = expr.slice(0, lastIndex)
        var footer = expr.slice(lastIndex)
        expr = header + "\n" + footer
    } else {
        expr = "\nreturn " + expr + ";" //IE全家 Function("return ")出错，需要Function("return ;")
    }
    
    
    var assignstr = []
    avalon.each(assigns,function(idx,el){
        // 这里跟上面 //bugfix:https://github.com/RubyLouvre/avalon/issues/1682 是相对应的。
        if(el.indexOf('_nousevar_')>-1){
            
            //子属性还没有创建，这里避免报错
            assignstr.push("try{var " + el + "}catch(e){}")
        }
        else{
            
            assignstr.push("var " + el )
            
        }
        
    });
    
    /* jshint ignore:start */
    getter = scpCompile(names.concat("'use strict';\n" + assignstr.join(";\n") + expr))
    /* jshint ignore:end */

    return evaluatorPool.put(exprId, getter)
}

function normalizeExpr(code) {
    var hasExpr = rexpr.test(code) //比如ms-class="width{{w}}"的情况
    if (hasExpr) {
        var array = scanExpr(code)
        if (array.length === 1) {
            return array[0].expr
        }
        return array.map(function (el) {
            return el.type ? "(" + el.expr + ")" : quote(el.expr)
        }).join(" + ")
    } else {
        return code
    }
}

avalon.normalizeExpr = normalizeExpr
avalon.parseExprProxy = parseExpr

var rthimRightParentheses = /\)\s*$/
var rthimOtherParentheses = /\)\s*\|/g
var rquoteFilterName = /\|\s*([$\w]+)/g
var rpatchBracket = /"\s*\["/g
var rthimLeftParentheses = /"\s*\(/g
function parseFilter(filters) {
    filters = filters
            .replace(rthimRightParentheses, "")//处理最后的小括号
            .replace(rthimOtherParentheses, function () {//处理其他小括号
                return "],|"
            })
            .replace(rquoteFilterName, function (a, b) { //处理|及它后面的过滤器的名字
                return "[" + quote(b)
            })
            .replace(rpatchBracket, function () {
                return '"],["'
            })
            .replace(rthimLeftParentheses, function () {
                return '",'
            }) + "]"
    /* jshint ignore:start */
    return scpCompile(["return [" + filters + "]"])()
    /* jshint ignore:end */
}