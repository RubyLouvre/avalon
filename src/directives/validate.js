var update = require('./_update')

var dir = avalon.directive('validate', {
//验证单个表单元素
    diff: function (copy, src, name) {
        var validator = copy[name]
        var p = src[name]
        if (p && p.onError && p.addField) {
            return
        } else if (Object(validator) === validator) {
            src.vmValidator = validator
            if (validator.$id) {//转换为普通对象
                validator = validator.$model
            }
           
            src[name] = validator
            for (var name in dir.defaults) {
                if (!validator.hasOwnProperty(name)) {
                    validator[name] = dir.defaults[name]
                }
            }
            validator.fields = validator.fields || []
            update(src, this.update)

        }
    },
    update: function (dom, vdom) {
        var validator = vdom['ms-validate']
        dom._ms_validator_ = validator
        validator.dom = dom
        var v = vdom.vmValidator 
        try{
           v.onManual = onManual
        }catch(e){}
        delete vdom.vmValidator 
        dom.setAttribute("novalidate", "novalidate")
        function onManual() {
            dir.validateAll.call(validator, validator.onValidateAll)
        }
        if (validator.validateAllInSubmit) {
            avalon.bind(dom, "submit", function (e) {
                e.preventDefault()
                onManual()
            })
        }
       
        if (typeof validator.onInit === "function") { //vmodels是不包括vmodel的
            validator.onInit.call(dom, {
                type: 'init',
                target: dom,
                validator: validator
            })
        }
    },
    validateAll: function (callback) {
        var validator = this
        var fn = typeof callback === "function" ? callback : validator.onValidateAll
        var promise = validator.fields.filter(function (field) {
            var el = field.dom
            return el && !el.disabled && validator.dom.contains(el)
        }).map(function (field) {
            return dir.validate(field, true)
        })
        var reasons = []
        Promise.all(promise).then(function (array) {
            for (var i = 0, el; el = array[i++]; ) {
                reasons = reasons.concat(el)
            }
            if (validator.deduplicateInValidateAll) {
                var uniq = {}
                reasons = reasons.filter(function (field) {
                    var el = field.dom
                    var uuid = el.uniqueID || (el.uniqueID = setTimeout("1"))
                    if (uniq[uuid]) {
                        return false
                    } else {
                        uniq[uuid] = true
                        return true
                    }
                })
            }
            fn.call(validator.dom, reasons) //这里只放置未通过验证的组件
        })
    },
    addField: function (field) {
        var validator = this
        var node = field.dom
        if (validator.validateInKeyup && (!field.isChanged && !field.debounceTime)) {
            avalon.bind(node, 'keyup', function (e) {
                dir.validate(field, 0, e)
            })
        }
        if (validator.validateInBlur) {
            avalon.bind(node, 'blur', function (e) {
                dir.validate(field, 0, e)
            })
        }
        if (validator.resetInFocus) {
            avalon.bind(node, 'focus', function (e) {
                validator.onReset.call(node, e, field)
            })
        }
    },
    validate: function (field, isValidateAll, event) {
        var promises = []
        var value = field.modelValue
        var elem = field.dom
        var validator = field.validator
        if (elem.disabled)
            return
        for (var ruleName in field.rules) {
            var ruleValue = field.rules[ruleName]
            if (ruleValue === false)
                continue
            var hook = avalon.validators[ruleName]
            var resolve, reject
            promises.push(new Promise(function (a, b) {
                resolve = a
                reject = b
            }))
            var next = function (a) {
                if (field.norequired && value === "") {
                    a = true
                }
                if (a) {
                    resolve(true)
                } else {
                    var reason = {
                        element: elem,
                        data: field.data,
                        message: elem.getAttribute("data-" + ruleName + "-message") || elem.getAttribute("data-message") || hook.message,
                        validateRule: ruleName,
                        getMessage: getMessage
                    }
                    resolve(reason)
                }
            }
            field.data = {}
            field.data[ruleName] = ruleValue
            hook.get(value, field, next)
        }
        var reasons = []
        //如果promises不为空，说明经过验证拦截器
        var lastPromise = Promise.all(promises).then(function (array) {
            for (var i = 0, el; el = array[i++]; ) {
                if (typeof el === "object") {
                    reasons.push(el)
                }
            }
            if (!isValidateAll) {
                if (reasons.length) {
                    validator.onError.call(elem, reasons, event)
                } else {
                    validator.onSuccess.call(elem, reasons, event)
                }
                validator.onComplete.call(elem, reasons, event)
            }
            return reasons
        })
        return lastPromise
    }
})

var rformat = /\\?{{([^{}]+)\}}/gm

function getMessage() {
    var data = this.data || {}
    return this.message.replace(rformat, function (_, name) {
        return data[name] == null ? "" : data[name]
    })
}
dir.defaults = {
    addField: dir.addField,//供内部使用,收集此元素底下的所有ms-duplex的域对象
    onError: avalon.noop,
    onSuccess: avalon.noop,
    onComplete: avalon.noop,
    onManual: avalon.noop,
    onReset: avalon.noop,
    onValidateAll: avalon.noop,
    validateInBlur: true, //@config {Boolean} true，在blur事件中进行验证,触发onSuccess, onError, onComplete回调
    validateInKeyup: true, //@config {Boolean} true，在keyup事件中进行验证,触发onSuccess, onError, onComplete回调
    validateAllInSubmit: true, //@config {Boolean} true，在submit事件中执行onValidateAll回调
    resetInFocus: true, //@config {Boolean} true，在focus事件中执行onReset回调,
    deduplicateInValidateAll: false //@config {Boolean} false，在validateAll回调中对reason数组根据元素节点进行去重
}