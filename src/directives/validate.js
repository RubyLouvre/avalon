import { avalon, isObject, platform } from '../seed/core'
var valiDir = avalon.directive('validate', {
    diff: function(oldVal, newVal, vdom) {
        if (!this.inited) {
            vdom.validator = null
        }
        if (vdom.validator) {
            return
        }
        if (isObject(newVal)) {
            //注意，这个Form标签的虚拟DOM有两个验证对象
            //一个是vmValidator，它是用户VM上的那个原始子对象，也是一个VM
            //一个是validator，它是vmValidator.$model， 这是为了防止IE6－8添加子属性时添加的hack
            //也可以称之为safeValidate
            vdom.vmValidator = newVal
            var validator = platform.toJson(newVal)
            vdom.validator = validator
            validator.fields = []
            for (var name in valiDir.defaults) {
                if (!validator.hasOwnProperty(name)) {
                    validator[name] = valiDir.defaults[name]
                }
            }
            return true
        }
    },
    update: function(value, vdom, newVdom, afterCb) {
        afterCb.push(function() {

            var validator = vdom.validator
            var dom = validator.dom = vdom.dom
            dom._ms_validate_ = validator
            var fields = validator.fields
            collectFeild(vdom.children, fields, validator)
            var type = window.netscape ? 'keypress' : 'focusin'
            avalon.bind(document, type, function(e) {
                var dom = e.target
                var duplex = dom._ms_duplex_
                var vdom = (duplex || {}).vdom
                if (duplex && vdom.rules && !duplex.validator) {
                    if (avalon.Array.ensure(fields, duplex)) {
                        bindValidateEvent(duplex, validator)
                    }

                }
            })

            //为了方便用户手动执行验证，我们需要为原始vmValidate上添加一个onManual方法
            var v = vdom.vmValidator
            try {
                v.onManual = onManual
            } catch (e) {}
            delete vdom.vmValidator



            dom.setAttribute('novalidate', 'novalidate')

            function onManual() {
                valiDir.validateAll.call(vdom, validator.onValidateAll)
            }
            /* istanbul ignore if */
            if (validator.validateAllInSubmit) {
                avalon.bind(dom, 'submit', function(e) {
                    e.preventDefault()
                    onManual()
                })
            }

            /* istanbul ignore if */
            if (typeof validator.onInit === 'function') { //vmodels是不包括vmodel的
                validator.onInit.call(dom, {
                    type: 'init',
                    target: dom,
                    validator: validator
                })
            }
        })

    },
    validateAll: function(callback) {
        var vdom = this
        var validator = vdom.validator

        var fields = validator.fields = []
        collectFeild(vdom.children, fields, validator)

        var fn = typeof callback === 'function' ? callback :
            validator.onValidateAll
        var promises = validator.fields.filter(function(field) {
            var el = field.dom
            return el && !el.disabled && validator.dom.contains(el)
        }).map(function(field) {
            return valiDir.validate(field, true)
        })

        var uniq = {}
        return Promise.all(promises).then(function(array) {
            var reasons = array.concat.apply([], array)
            if (validator.deduplicateInValidateAll) {

                reasons = reasons.filter(function(reason) {
                    var el = reason.element
                    var uuid = el.uniqueID || (el.uniqueID = setTimeout('1'))

                    if (uniq[uuid]) {
                        return false
                    } else {
                        return uniq[uuid] = true
                    }
                })
            }
            fn.call(validator.dom, reasons) //这里只放置未通过验证的组件
        })
    },

    validate: function(field, isValidateAll, event) {
        var promises = []
        var value = field.value
        var elem = field.dom

        /* istanbul ignore if */
        if (typeof Promise !== 'function') { //avalon-promise不支持phantomjs
            avalon.wain('please npm install es6-promise or bluebird')
        }
        /* istanbul ignore if */
        if (elem.disabled)
            return
        var rules = field.vdom.rules
        var ngs = [],
            isOk = true
        if (!(rules.norequired && value === '')) {
            for (var ruleName in rules) {
                var ruleValue = rules[ruleName]
                if (ruleValue === false)
                    continue
                var hook = avalon.validators[ruleName]
                var resolve
                promises.push(new Promise(function(a, b) {
                    resolve = a
                }))
                var next = function(a) {
                    var reason = {
                        element: elem,
                        data: field.data,
                        message: elem.getAttribute('data-' + ruleName + '-message') || elem.getAttribute('data-message') || hook.message,
                        validateRule: ruleName,
                        getMessage: getMessage
                    }
                    if (a) {
                        resolve(true)
                    } else {
                        isOk = false
                        ngs.push(reason)
                        resolve(false)
                    }
                }
                field.data = {}
                field.data[ruleName] = ruleValue
                hook.get(value, field, next)
            }
        }

        //如果promises不为空，说明经过验证拦截器
        return Promise.all(promises).then(function(array) {
            if (!isValidateAll) {
                var validator = field.validator
                if (isOk) {
                    validator.onSuccess.call(elem, [{
                        data: field.data,
                        element: elem
                    }], event)
                } else {
                    validator.onError.call(elem, ngs, event)
                }
                validator.onComplete.call(elem, ngs, event)
            }
            return ngs
        })
    }
})

function collectFeild(nodes, fields, validator) {
    for (var i = 0, vdom; vdom = nodes[i++];) {
        var duplex = vdom.rules && vdom.duplex
        if (duplex) {
            fields.push(duplex)
            bindValidateEvent(duplex, validator)
        } else if (vdom.children) {
            collectFeild(vdom.children, fields, validator)
        } else if (Array.isArray(vdom)) {
            collectFeild(vdom, fields, validator)
        }
    }
}

function bindValidateEvent(field, validator) {

    var node = field.dom
    if (field.validator) {
        return
    }
    field.validator = validator
        /* istanbul ignore if */
    if (validator.validateInKeyup && (!field.isChanged && !field.debounceTime)) {
        avalon.bind(node, 'keyup', function(e) {
            validator.validate(field, 0, e)
        })
    }
    /* istanbul ignore if */
    if (validator.validateInBlur) {
        avalon.bind(node, 'blur', function(e) {
            validator.validate(field, 0, e)
        })
    }
    /* istanbul ignore if */
    if (validator.resetInFocus) {
        avalon.bind(node, 'focus', function(e) {
            validator.onReset.call(node, e, field)
        })
    }
}
var rformat = /\\?{{([^{}]+)\}}/gm

function getMessage() {
    var data = this.data || {}
    return this.message.replace(rformat, function(_, name) {
        return data[name] == null ? '' : data[name]
    })
}
valiDir.defaults = {
    validate: valiDir.validate,
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