var dir = avalon.directive('validate', {
//验证单个表单元素
    parse: function (binding, num) {
        return 'vnode' + num + '.props["ms-validate"] = ' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre, steps, name) {
        var a = cur.props[name]
        var p = pre.props[name]
        if (p && p.onError && p.addField) {
            cur.props[name] = p
        } else if (Object(a) === a) {
            a.fields = a.fields || []
            a.onError = a.onError || avalon.noop
            a.onSuccess = a.onSuccess || avalon.noop
            a.onComplete = a.onComplete || avalon.noop
            a.onReset = a.onReset || avalon.noop
            a.addField = dir.addField
            var list = cur.change || (cur.change = [])
            if (avalon.Array.ensure(list, this.update)) {
                steps.count += 1
            }
        }
    },
    update: function (node, vnode) {
        var options = vnode.props['ms-validate']
        node._ms_validator_ = options
        node.setAttribute("novalidate", "novalidate");
        if (options.validateAllInSubmit) {
            avalon.bind(node, "submit", function (e) {
                e.preventDefault()
                dir.validateAll.call(options, options.onValidateAll)
            })
        }
        if (typeof options.onInit === "function") { //vmodels是不包括vmodel的
            options.onInit.call(node)
        }
    },
    validateAll: function (callback) {
        var options = this
        var fn = typeof callback === "function" ? callback : options.onValidateAll
        var promise = options.fields.filter(function (field) {
            var el = field.element
            return el && !el.disabled && options.elem.contains(el)
        }).map(function (field) {
            return dir.validate(field, true)
        })
        Promise.all(promise).then(function (array) {
            var reasons = []
            for (var i = 0, el; el = array[i++]; ) {
                reasons = reasons.concat(el)
            }
            if (options.deduplicateInValidateAll) {
                var uniq = {}
                reasons = reasons.filter(function (field) {
                    var el = field.element
                    var id = el.getAttribute("data-validation-id")
                    if (!id) {
                        id = setTimeout("1")
                        el.setAttribute("data-validation-id", id)
                    }
                    if (uniq[id]) {
                        return false
                    } else {
                        uniq[id] = true
                        return true
                    }
                })
            }
            fn.call(options.elem, reasons) //这里只放置未通过验证的组件
        })
    },
    addField: function (field) {
        var options = this
        var node = field.element
        if (options.validateInKeyup) {
            avalon.bind(node, 'keyup', function (e) {
                dir.validate(field, 0, e)
            })
        }
        if (options.validateInBlur) {
            avalon.bind(node, 'blur', function (e) {
                dir.validate(field, 0, e)
            })
        }
        if (options.resetInFocus) {
            avalon.bind(node, 'focus', function (e) {
                options.onReset.call(node, e, field)
            })
        }
    },
    validate: function (field, isValidateAll, event) {
        var promises = []
        var value = field.get(field.vmodel)
        var elem = field.element
        var options = field.validator
        if (elem.disabled)
            return
        field.validators.replace(/\w+/g, function (name) {
            var hook = avalon.validators[name]
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
                        message: elem.getAttribute("data-duplex-" + name + "-message") || elem.getAttribute("data-duplex-message") || hook.message,
                        validateRule: name,
                        getMessage: getMessage
                    }
                    resolve(reason)
                }
            }
            field.data = {}
            hook.get(value, field, next)
        })
        //如果promises不为空，说明经过验证拦截器
        var lastPromise = Promise.all(promises).then(function (array) {
            var reasons = []
            for (var i = 0, el; el = array[i++]; ) {
                if (typeof el === "object") {
                    reasons.push(el)
                }
            }
            if (!isValidateAll) {
                if (reasons.length) {
                    options.onError.call(elem, reasons, event)
                } else {
                    options.onSuccess.call(elem, reasons, event)
                }
                options.onComplete.call(elem, reasons, event)
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