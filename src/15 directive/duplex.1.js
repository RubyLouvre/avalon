//双工绑定
var duplexBinding = bindingHandlers.duplex = function(data, vmodels) {
    var elem = data.element,
            hasCast
    parseExprProxy(data.value, vmodels, data, 0, 1)

    data.changed = getBindingCallback(elem, "data-duplex-changed", vmodels) || noop
    if (data.evaluator && data.args) {
        var params = []
        var casting = oneObject("string,number,boolean,checked")
        if (elem.type === "radio" && data.param === "") {
            data.param = "checked"
        }
        if (elem.msData) {
            elem.msData["ms-duplex"] = data.value
        }
        data.param.replace(/\w+/g, function(name) {
            if (/^(checkbox|radio)$/.test(elem.type) && /^(radio|checked)$/.test(name)) {
                if (name === "radio")
                    log("ms-duplex-radio已经更名为ms-duplex-checked")
                name = "checked"
                data.isChecked = true
            }
            if (name === "bool") {
                name = "boolean"
                log("ms-duplex-bool已经更名为ms-duplex-boolean")
            } else if (name === "text") {
                name = "string"
                log("ms-duplex-text已经更名为ms-duplex-string")
            }
            if (casting[name]) {
                hasCast = true
            }
            avalon.Array.ensure(params, name)
        })
        if (!hasCast) {
            params.push("string")
        }
        data.param = params.join("-")
        data.bound = function(type, callback) {
            if (elem.addEventListener) {
                elem.addEventListener(type, callback, false)
            } else {
                elem.attachEvent("on" + type, callback)
            }
            var old = data.rollback
            data.rollback = function() {
                elem.avalonSetter = null
                avalon.unbind(elem, type, callback)
                old && old()
            }
        }
        for (var i in avalon.vmodels) {
            var v = avalon.vmodels[i]
            v.$fire("avalon-ms-duplex-init", data)
        }
        var cpipe = data.pipe || (data.pipe = pipe)
        cpipe(null, data, "init")
        var tagName = elem.tagName
        duplexBinding[tagName] && duplexBinding[tagName](elem, data.evaluator.apply(null, data.args), data)
    }
}
//不存在 bindingExecutors.duplex
function fixNull(val) {
    return val == null ? "" : val
}
avalon.duplexHooks = {
    checked: {
        get: function(val, data) {
            return !data.element.oldValue
        }
    },
    string: {
        get: function(val) { //同步到VM
            return val
        },
        set: fixNull
    },
    "boolean": {
        get: function(val) {
            return val === "true"
        },
        set: fixNull
    },
    number: {
        get: function(val) {
            return isFinite(val) ? parseFloat(val) || 0 : val
        },
        set: fixNull
    }
}

function pipe(val, data, action, e) {
    data.param.replace(/\w+/g, function(name) {
        var hook = avalon.duplexHooks[name]
        if (hook && typeof hook[action] === "function") {
            val = hook[action](val, data)
        }
    })
    return val
}

var TimerID, ribbon = []
function W3CFire(el, name, detail) {
    var event = DOC.createEvent("Events")
    event.initEvent(name, true, true)
    event.fireByAvalon = true//签名，标记事件是由avalon触发
    //event.isTrusted = false 设置这个opera会报错
    if (detail)
        event.detail = detail
    el.dispatchEvent(event)
}


avalon.tick = function(fn) {
    if (ribbon.push(fn) === 1) {
        TimerID = setInterval(ticker, 60)
    }
}

function ticker() {
    for (var n = ribbon.length - 1; n >= 0; n--) {
        var el = ribbon[n]
        if (el() === false) {
            ribbon.splice(n, 1)
        }
    }
    if (!ribbon.length) {
        clearInterval(TimerID)
    }
}

var watchValueInTimer = noop
new function() {
    try {//#272 IE9-IE11, firefox
        var setters = {}
        var aproto = HTMLInputElement.prototype
        var bproto = HTMLTextAreaElement.prototype
        function newSetter(value) {
            if (avalon.contains(root, this)) {
                setters[this.tagName].call(this, value)
                if (this.avalonSetter) {
                    this.avalonSetter()
                }
            }
        }
        var inputProto = HTMLInputElement.prototype
        Object.getOwnPropertyNames(inputProto) //故意引发IE6-8等浏览器报错
        setters["INPUT"] = Object.getOwnPropertyDescriptor(aproto, "value").set
        Object.defineProperty(aproto, "value", {
            set: newSetter
        })
        setters["TEXTAREA"] = Object.getOwnPropertyDescriptor(bproto, "value").set
        Object.defineProperty(bproto, "value", {
            set: newSetter
        })
    } catch (e) {
        watchValueInTimer = avalon.tick
    }
}
