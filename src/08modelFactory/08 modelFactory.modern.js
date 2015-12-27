//avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个ViewModel(VM)
avalon.vmodels = {} //所有vmodel都储存在这里
var vtree = {}
var dtree = {}

avalon.define = function (definition) {
    var $id = definition.$id
    if (!$id) {
        log("warning: vm必须指定$id")
    }
    var vmodel = observeObject(definition, {
        timestamp: new Date() - 0
    }, {
        top: true
    })

    avalon.vmodels[$id] = vmodel
    vmodel.$id = $id


    return vmodel
}


//observeArray及observeObject的包装函数
function observe(definition, old, heirloom, options) {
    if (Array.isArray(definition)) {
        return observeArray(definition, old, heirloom, options)
    } else if (avalon.isPlainObject(definition)) {
        var vm = observeObject(definition, heirloom, options)
        for (var i in old) {
            if (vm.hasOwnProperty(i)) {
                vm[i] = old[i]
            }
        }
        return vm
    } else {
        return definition
    }
}


//将普通数组转换为监控数组
function observeArray(array, old, heirloom, options) {
    if (old && old.splice) {
        var args = [0, old.length].concat(array)
        old.splice.apply(old, args)
        return old
    } else {
        for (var i in newProto) {
            array[i] = newProto[i]
        }
        array._ = observeObject({
            length: NaN
        }, {}, {
            pathname: "",
            top: true//这里不能使用watch, 因为firefox中对象拥有watch属性
        })
        array.notify = function () {
            $emit(heirloom.vm, heirloom.vm, options.pathname)
            batchUpdateEntity(heirloom.vm)
        }
        array._.length = array.length
        array._.$watch("length", function (a, b) {
            if (heirloom.vm) {
                heirloom.vm.$fire(options.pathname + ".length", a, b)
            }
        })


        hideProperty(array, "$model", $modelDescriptor)

        var arrayOptions = {
            pathname: options.pathname + "*",
            top: true
        }
        for (var j = 0, n = array.length; j < n; j++) {
            array[j] = observe(array[j], 0, heirloom, arrayOptions)
        }

        return array
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
 =============================
 $skipArray:用于指定不可监听的属性,但VM生成是没有此属性的
 
 $$skipArray与$skipArray都不能监控,
 不同点是
 $$skipArray被hasOwnProperty后返回false
 $skipArray被hasOwnProperty后返回true
 */
var $$skipArray = oneObject("$id,$watch,$fire,$events,$model,$skipArray,$active")

function observeObject(definition, heirloom, options) {
    options = options || {}
    heirloom = heirloom || {}

    var $skipArray = {}//收集所有不可监听属性
    if (definition.$skipArray) {
        $skipArray = oneObject(definition.$skipArray)
        delete definition.$skipArray
    }
    var $computed = getComputed(definition) // 收集所有计算属性
    var $pathname = options.pathname || ""
    var skipDollar = options.skipDollar || {}
    var $vmodel = new Component() //要返回的对象, 它在IE6-8下可能被偷龙转凤
    var $accessors = {} //用于储放所有访问器属性的定义
    var hasOwn = {}    //用于实现hasOwnProperty方法
    var simple = []    //用于储放简单类型的访问器属性的名字
    var skip = []

    for (var key in definition) {
        if ($$skipArray[key])
            continue
        var val = definition[key]
        hasOwn[key] = true
        if (!isObervable(key, val, $skipArray, skipDollar)) {
            simple.push(key)
            var path = $pathname ? $pathname + "." + key : key
            $accessors[key] = makeObservable(path, heirloom)
        } else {
            skip.push(key)
        }
    }

    for (var name in $computed) {
        hasOwn[key] = true
        path = $pathname ? $pathname + "." + key : key
        $accessors[key] = makeComputed(path, heirloom, key, $computed[key])
    }

    $accessors["$model"] = $modelDescriptor

    Object.defineProperties($vmodel, $accessors)

    function trackBy(name) {
        return hasOwn[name] === true
    }

    skip.forEach(function (name) {
        $vmodel[name] = definition[name]
    })
    simple.forEach(function (name) {
        $vmodel[name] = definition[name]
    })

    hideProperty($vmodel, "$id", "anonymous")
    hideProperty($vmodel, "$active", false)
    hideProperty($vmodel, "hasOwnProperty", trackBy)
    //在高级浏览器,我们不需要搞一个$accessors存放所有访问器属性的定义
    //直接用Object.getOwnPropertyDescriptor获取它们
    if (options.top === true) {
        makeFire($vmodel, heirloom)
    }

    for (name in $computed) {
        val = $vmodel[name]
    }

    $vmodel.$active = true
    return $vmodel
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

function isObservable(key, value, skipArray) {
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
                collectDependency(pathname, heirloom)
            }
            return old
        },
        set: function (val) {
            if (old === val)
                return
            val = observe(val, old, heirloom, {
                pathname: pathname
            })
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

function makeFire($vmodel, heirloom) {
    hideProperty($vmodel, "$events", {})
    hideProperty($vmodel, "$watch", $watch)
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

function createProxy(before, after, heirloom) {
    var accessors = {}
    var skip = {}
    var hasOwn = {}
    //收集所有键值对及访问器属性
    for (var k in before) {
        var accessor = Object.getOwnPropertyDescriptor(before, k)
        if (accessor.set) {
            accessors[k] = accessor
        } else {
            skip[k] = before[k]
        }
        hasOwn = true
    }
    for (var k in after) {
        var accessor = Object.getOwnPropertyDescriptor(after, k)
        if (accessor.set) {
            accessors[k] = accessor
        } else {
            skip[k] = after[k]
        }
        hasOwn = true
    }
    var $vmodel = {}
    $vmodel = Object.defineProperties($vmodel, accessors)
    for (var k in skip) {
        $vmodel[k] = keys[k]
    }
    for (k in $$skipArray) {
        delete hasOwn[k]
    }

    function trackBy(name) {
        return hasOwn[name] === true
    }
    hideProperty($vmodel, "$id", before.$id + "_")
    hideProperty($vmodel, "hasOwnProperty", trackBy)
    hideProperty($vmodel, "$events", {})

    makeFire($vmodel, heirloom || {})
    $vmodel.$active = true
    return $vmodel
}

avalon.createProxy = createProxy

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
    Object.defineProperty(host, name, {
        value: value,
        writable: true,
        enumerable: false,
        configurable: true
    })
}


//监听对象属性值的变化(注意,数组元素不是数组的属性),通过对劫持当前对象的访问器实现
//监听对象或数组的结构变化, 对对象的键值对进行增删重排, 或对数组的进行增删重排,都属于这范畴
//   通过比较前后代理VM顺序实现
