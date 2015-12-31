//avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个ViewModel(VM)
avalon.vmodels = {} //所有vmodel都储存在这里
var vtree = {}
var dtree = {}
avalon.vtree = vtree

var defineProperty = Object.defineProperty
var canHideOwn = true
//如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
//标准浏览器使用__defineGetter__, __defineSetter__实现
try {
    defineProperty({}, "_", {
        value: "x"
    })
    var defineProperties = Object.defineProperties
} catch (e) {
    canHideOwn = false
}

avalon.define = function (definition) {
    var $id = definition.$id
    if (!$id) {
        log("warning: vm必须指定$id")
    }
    var vmodel = observeObject(definition, {
        __: "avalon.define"
    }, {
        top: true
    })

    avalon.vmodels[$id] = vmodel
    vmodel.$id = $id

    return vmodel
}

//observeArray及observeObject的包装函数
function observe(definition, old, heirloom, options) {
    //如果数组转换为监控数组
    if (Array.isArray(definition)) {
        return observeArray(definition, old, heirloom, options)
    } else if (avalon.isPlainObject(definition)) {
        //如果此属性原来就是一个VM,拆分里面的访问器属性
        if (Object(old) === old) {
            var vm = reuseVmodel(old, definition, heirloom)
            for (var i in definition) {
                vm[i] = definition[i]
            }
            return vm
        } else {
            //否则新建一个VM
            return observeObject(definition, heirloom, options)
        }
    } else {
        return definition
    }
}

function Component() {
}

/*
 将一个对象转换为一个VM
 它拥有如下私有属性
 $id: vm.id
 $events: 放置$watch回调与绑定对象
 $watch: 增强版$watch
 $fire: 触发$watch回调
 $active:boolean,false时防止依赖收集
 $model:返回一个纯净的JS对象
 $accessors:avalon.js独有的对象
 =============================
 $skipArray:用于指定不可监听的属性,但VM生成是没有此属性的
 
 $$skipArray与$skipArray都不能监控,
 不同点是
 $$skipArray被hasOwnProperty后返回false
 $skipArray被hasOwnProperty后返回true
 */



var $$skipArray = oneObject("$id,$watch,$fire,$events,$model," +
        "$skipArray,$active,$accessors")


function observeObject(definition, heirloom, options) {
    options = options || {}
    heirloom = heirloom || {}

    var $skipArray = {}
    if (definition.$skipArray) {//收集所有不可监听属性
        $skipArray = oneObject(definition.$skipArray)
        delete definition.$skipArray
    }
    var $computed = getComputed(definition) // 收集所有计算属性
    var $pathname = options.pathname || ""
    var $vmodel = new Component() //要返回的对象, 它在IE6-8下可能被偷龙转凤
    var $accessors = {} //用于储放所有访问器属性的定义
    var keys = {}, key, path

    for (key in definition) {
        if ($$skipArray[key])
            continue
        var val = keys[key] = definition[key]
        if (!isSkip(key, val, $skipArray)) {
            path = $pathname ? $pathname + "." + key : key
            $accessors[key] = makeObservable(path, heirloom)
        }
    }

    for (key in $computed) {
        keys[key] = definition[key]
        path = $pathname ? $pathname + "." + key : key
        $accessors[key] = makeComputed(path, heirloom, key, $computed[key])
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

    hideProperty($vmodel, "$id", generateID("$"))
    hideProperty($vmodel, "$accessors", $accessors)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    if (options.top === true) {
        makeFire($vmodel, heirloom)
    }

    for (key in $computed) {
        val = $vmodel[key]
    }

    hideProperty($vmodel, "$active", true)
    return $vmodel
}

function makeFire($vmodel, heirloom) {

    hideProperty($vmodel, "$events", {})
    hideProperty($vmodel, "$watch", function (expr, fn) {
        if (expr && fn) {
            return $watch.call($vmodel, expr, fn)
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
            if (heirloom.vm) {
                $emit(heirloom.vm, $vmodel, expr, a, b)
            }
        }
    })
    heirloom.vm = heirloom.vm || $vmodel
}

function isComputed(val) {//speed up!
    if (val && typeof val === "object") {
        for (var i in val) {
            if (i !== "get" && i !== "set") {
                return false
            }
        }
        return  typeof val.get === "function"
    }
}

function getComputed(obj) {
    if (obj.$computed) {
        delete obj.$computed
        return obj.$computed
    }
    var $computed = {}
    for (var i in obj) {
        if (isComputed(obj[i])) {
            $computed[i] = obj[i]
            delete obj[i]
        }
    }
    return $computed
}



function makeComputed(pathname, heirloom, key, value) {
    var old = NaN, _this = {}
    return {
        get: function () {
            if (!this.configurable) {
                _this = this
            }
            return old = value.get.call(_this)
        },
        set: function (x) {
            if (typeof value.set === "function") {
                if (!this.configurable) {
                    _this = this
                }
                var older = old
                value.set.call(_this, x)
                var newer = _this[key]
                if (_this.$active && (newer !== older)) {
                    $emit(heirloom.vm, _this, pathname, newer, older)
                    batchUpdateEntity(heirloom.vm)
                }
            }
        },
        enumerable: true,
        configurable: true
    }
}

function isSkip(key, value, skipArray) {
    return key.charAt(0) === "$" ||
            skipArray[key] ||
            (typeof value === "function") ||
            (value && value.nodeName && value.nodeType > 0)
}


function makeObservable(pathname, heirloom) {
    var old = NaN, _this = {}
    return {
        get: function () {
            if (!this.configurable) {
                _this = this // 保存当前子VM的引用
            }
            if (_this.$active) {
                //以后再处理  collectDependency(pathname, heirloom)
            }
            return old
        },
        set: function (val) {
            if (old === val)
                return
            if (val && typeof val === "object") {

                val = observe(val, old, heirloom, {
                    pathname: pathname
                })
            }
            if (!this.configurable) {
                _this = this // 保存当前子VM的引用
            }
            var older = old
            old = val

            if (_this.$active) {
                $emit(heirloom.vm, _this, pathname, val, older)
                batchUpdateEntity(heirloom.vm)
            }

        },
        enumerable: true,
        configurable: true
    }
}
function SubComponent() {
}
//循环利用before的访问器属性,创建新的VM
function reuseVmodel(before, after, heirloom, pathname) {
    var resue = before.$accessors || {}
    var $accessors = {}
    var keys = {}, key, path
    for (key in after) {
        if ($$skipArray[key])
            continue
        keys[key] = before[key]
        if (!isSkip(key, after[key], {})) {
            if (resue[key]) {
                $accessors[key] = resue[key]
            } else {
                path = pathname ? pathname + "." + key : key
                $accessors[key] = makeObservable(path, heirloom)
            }
        }
    }

    var $vmodel = new SubComponent()
    $vmodel = defineProperties($vmodel, $accessors, keys)

    for (key in keys) {
        if (!$accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        keys[key] = true
    }

    function hasOwnKey(key) {
        return keys[key] === true
    }

    hideProperty($vmodel, "$accessors", $accessors)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    hideProperty($vmodel, "$active", true)
    return $vmodel
}

function createProxy(before, after, heirloom) {
    var b = before.$accessors || {}
    var a = after.$accessors || {}
    var $accessors = {}
    var keys = {}, key
    //收集所有键值对及访问器属性
    for (key in before) {
        keys[key] = before[key]
        if (b[key]) {
            $accessors[key] = b[key]
        }
    }
    for (key in after) {
        keys[key] = after[key]
        if (a[key]) {
            $accessors[key] = a[key]
        }
    }
    var $vmodel = new Component()
    $vmodel = defineProperties($vmodel, $accessors, keys)

    for (key in keys) {
        if (!$accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        if (key in $$skipArray) {
            delete keys[key]
        } else {
            keys[key] = true
        }
    }

    function hasOwnKey(key) {
        return keys[key] === true
    }

    hideProperty($vmodel, "$accessors", $accessors)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    hideProperty($vmodel, "$id", before.$id + "??" +
            String(after.$id).slice(0, 4))

    makeFire($vmodel, heirloom || {})
    hideProperty($vmodel, "$active", true)
    return $vmodel
}

avalon.test.makeObservable = makeObservable
avalon.test.createProxy = createProxy


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

var $modelDescriptor = {
    get: function () {
        return toJson(this)
    },
    set: noop,
    enumerable: false,
    configurable: true
}

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
