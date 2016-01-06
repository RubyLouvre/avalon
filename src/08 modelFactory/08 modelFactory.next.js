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
        watch: true
    })

    avalon.vmodels[$id] = vmodel
    vmodel.$id = $id
    avalon.ready(function () {
        if (!vtree[$id]) {
            var all = document.getElementsByTagName("*")
            for (var i = 0, node; node = all[i++]; ) {
                if (node.nodeType !== 1)
                    continue
                if (node.getAttribute("ms-controller") === $id
                        || node.getAttribute("ms-important") === $id) {
                    dtree[$id] = node;
                    vtree[$id] = buildVTree(node.outerHTML)
                    break
                }
            }
        }
    })

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
        }, heirloom, {
            pathname: options.pathname + ".length",
            watch: true
        })
        array._.length = array.length
        array._.$watch("length", function (a, b) {
        })


        hideProperty(array, "$model", $modelDescriptor)

        var arrayOptions = {
            pathname: options.pathname + "*",
            watch: true
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

    for (var key in $computed) {
        var val = $computed[key]
        Object.defineProperty(definition, key, {
            set: val.set || noop,
            get: val.get,
            enumerable: true,
            configurable: true
        })
    }
    var heirloom = {
        set: function (target, property, value, receiver) {
            if (!isObervable(property, value, $skipArray)) {
                return target[property] = value
            }
            var oldValue = target[property]
            var path = receiver.$pathname ?
                    receiver.$pathname + "." + property : property
            if ((typeof value === "object") && !("$pathname" in value)) {
                value = new Proxy(value, heirloom)
                value.$pathname = path
            }
            if (value !== oldValue) {
                target[property] = value
                console.log("emitChange", path, value, oldValue)
            }
        },
        get: function (target, property) {
            return target[property]
        }
    }



   

//    for (var name in $computed) {
//        hasOwn[key] = true
//        path = $pathname ? $pathname + "." + key : key
//        $accessors[key] = makeComputed(path, heirloom, key, $computed[key])
//    }

    $accessors["$model"] = $modelDescriptor

   
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
                    heirloom.vm.$fire(pathname, newer, older)
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
            if (_this.$active) {
                // console.log(heirloom)
                console.log("$fire ", pathname, _this, heirloom.vm)
                heirloom.vm.$fire(pathname, val, old)
            }
            old = val
        },
        enumerable: true,
        configurable: true
    }
}

function createProxy(before, after) {
    var accessors = {}
    var skip = {}
    //收集所有键值对及访问器属性
    for (var k in before) {
        var accessor = Object.getOwnPropertyDescriptor(before, k)
        if (accessor.set) {
            accessors[k] = accessor
        } else {
            skip[k] = before[k]
        }
    }
    for (var k in after) {
        var accessor = Object.getOwnPropertyDescriptor(after, k)
        if (accessor.set) {
            accessors[k] = accessor
        } else {
            skip[k] = after[k]
        }
    }
    var $vmodel = {}
    $vmodel = Object.defineProperties($vmodel, accessors)
    for (var k in skip) {
        $vmodel[k] = keys[k]
    }
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
/*
            var handler = {
                vm: null,
               
                set: function (target, property, value, receiver) {
                    
        
                    var oldValue = target[property]

                    var p = receiver.pathname ? receiver.pathname + "." + property : property

                    // console.log(value)
                    if ((typeof value === "object") && !("pathname" in value)) {
                        value = new Proxy(value, handler)
                        value.pathname = p
                    }


                    if (value !== oldValue) {
                        target[property] = value
                        console.log("emitChange", p, value, oldValue)
                    }


                },
                get: function (target, property) {

                    return target[property]
                }
            }

            var  obj = {
                p: 1,
                d: 88
            }
            Object.defineProperty(obj, "fullName", {
                get: function () {
                    return this.p
                },
                set: function (v) {
                    this.p = v + 1
                }
            })
            var proxy = new Proxy(obj, handler)
            //console.log(Object.prototype.toString.call(proxy)+"")
            proxy.pathname = ""
            handler.vm = proxy

            proxy.p = 9
            proxy.fn = function(){}
            proxy.d = {i: 0}
            proxy.d.oo = 444
            proxy.e = 4
            proxy.fullName = 999
            console.log(proxy.fullName)
            proxy.fullName = 888
            console.log(proxy.hasOwnProperty("p"))
            
            */