var defineProperty = Object.defineProperty

//如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
//标准浏览器使用__defineGetter__, __defineSetter__实现
var canHideOwn = true
try {
    defineProperty({}, "_", {
        value: "x"
    })
    var defineProperties = Object.defineProperties
} catch (e) {
    canHideOwn = false
}

//系统属性
var $$skipArray = oneObject("$id,$watch,$fire,$events,$model,$skipArray,$hashcode,$accessors")

/**
 * 生成一个vm
 *
 * @param {Object} definition 用户的原始数据
 * @param {Object} heirloom   用来保存顶层vm的引用
 * @param {Object} options
 *        top      {Boolean} 是否顶层vm
 *        idname   {String}  $id
 *        pathname {String}  当前路径
 * @returns {Component}
 */

function observeObject(definition, heirloom, options) {
    options = options || {}
    var $skipArray = {}

    if (definition.$skipArray) {//收集所有不可监听属性
        $skipArray = oneObject(definition.$skipArray)
        delete definition.$skipArray
    }

    var keys = {}
    var $accessors = {}
    var $vmodel = new Component()
    var $pathname = options.pathname || ""
    var $computed = getComputed(definition)
    var $idname = options.idname || makeHashCode("$")

    var key, sid, spath

    for (key in definition) {
        if ($$skipArray[key])
            continue
        var val = keys[key] = definition[key]
        if (!isSkip(key, val, $skipArray)) {
            sid = $idname + "." + key
            spath = $pathname ? $pathname + "." + key : key
            $accessors[key] = makeObservable(sid, spath, heirloom)
        }
    }

    for (key in $computed) {
        keys[key] = definition[key]
        sid = $idname + "." + key
        spath = $pathname ? $pathname + "." + key : key
        $accessors[key] = makeComputed(sid, spath, heirloom, key, $computed[key])
    }

    $accessors.$model = $modelDescriptor

    $vmodel = defineProperties($vmodel, $accessors, definition)

    for (key in keys) {
        //对普通监控属性或访问器属性进行赋值
        if (!(key in $computed)) {
            $vmodel[key] = keys[key]
        }
        //删除系统属性
        if (key in $skipArray) {
            delete keys[key]
        } else {
            keys[key] = true
        }
    }

    function hasOwnKey(key) {
        return keys[key] === true
    }

    hideProperty($vmodel, "$id", $idname)
    hideProperty($vmodel, "$accessors", $accessors)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)

    if (options.top === true) {
        makeFire($vmodel, heirloom)
    }

    for (key in $computed) {
        val = $vmodel[key]
    }

    hideProperty($vmodel, "$hashcode", makeHashCode("$"))

    return $vmodel
}


/**
 * 为vm添加$events, $watch, $fire方法
 *
 * @param {Component} $vmodel
 * @returns {undefined}
 */
function makeFire($vmodel, heirloom) {
    heirloom.__vmodel__ = $vmodel
    hideProperty($vmodel, "$events", heirloom)
    hideProperty($vmodel, "$watch", function (expr, fn) {
        if (expr && fn) {
            return $watch.apply($vmodel, arguments)
        } else {
            throw "$watch方法参数不对"
        }
    })
    hideProperty($vmodel, "$fire", function (expr, a, b) {
        if (expr.indexOf("all!") === 0) {
            var p = expr.slice(4)
            for (var i in avalon.vmodels) {
                var v = avalon.vmodels[i]
                v.$fire && v.$fire(p, a, b)
            }
        } else {
//            if ($vmodel.hasOwnProperty(expr)) {
//                var prop = W3C ?
//                        Object.getOwnPropertyDescriptor($vmodel, expr) :
//                        $vmodel.$accessors[expr]
//                var list = prop && prop.get && prop.get.list
//              
//            } else {
            var list = $vmodel.$events[expr]
//            }
            $emit(list, $vmodel, expr, a, b)
        }
    })
}


/**
 * 生成vm的$model
 *
 * @param {Component} val
 * @returns {Object|Array}
 */
function toJson(val) {
    var xtype = avalon.type(val)
    if (xtype === "array") {
        var array = []
        for (var i = 0; i < val.length; i++) {
            array[i] = toJson(val[i])
        }
        return array
    } else if (xtype === "object") {
        var obj = {}
        for (i in val) {
            if (i === "__proxy__" || i === "__data__" || i === "__const__")
                continue
            if (val.hasOwnProperty(i)) {
                var value = val[i]
                obj[i] = value && value.nodeType ? value : toJson(value)
            }
        }
        return obj
    }
    return val
}

/**
 * 添加不可遍历的系统属性($$skipArray中的那些属性)
 *
 * @param {type} host
 * @param {type} name
 * @param {type} value
 * @returns {undefined}
 */

function hideProperty(host, name, value) {
    if (canHideOwn) {
        Object.defineProperty(host, name, {
            value: value,
            writable: true,
            enumerable: false,
            configurable: true
        })
    } else {
        host[name] = value
    }
}


/*
 var proxy = avalon.vtree.test.children[3].children[1].children[1].vmodel
 proxy.$accessors.a.get == proxy.el.$accessors.a.get
 true
 proxy.$accessors.a.get == vm.array[0].$accessors.a.get
 true
 */
//旧的数组元素 -->  旧的proxy vm
//新的数组元素 -->
//如果数组元素是简单类型 ，无法转换为vm， 其订阅数组保存到 proxy vm的el中
//新的数组元素， 重用旧的proxy vm, 更换其绑定对象
