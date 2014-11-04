define(["avalon"], function(avalon) {

    if (!avalon.duplexHooks) {
        throw new Error("你的版本少于avalon1.3.7，不支持ms-duplex2.0，请使用avalon.validation.old.js")
    }
    //==========================avalon.validation的专有逻辑========================

    avalon.mix(avalon.duplexHooks, {
        trim: {
            get: function(value, data) {
                if (data.element.type !== "password") {
                    value = String(value || "").trim()
                }
                return value
            }
        },
        required: {
            message: '必须填写',
            get: function(value, data, next) {
                next(value !== "")
                return value
            }
        },
        "int": {
            message: "必须是整数",
            get: function(value, data, next) {
                next(/^\-?\d+$/.test(value))
                return value
            }
        },
        decimal: {
            message: '必须是小数',
            get: function(value, data, next) {
                next(/^\-?\d*\.?\d+$/.test(value))
                return value
            }
        },
        alpha: {
            message: '必须是字母',
            get: function(value, data, next) {
                next(/^[a-z]+$/i.test(value))
                return value
            }
        },
        alpha_numeric: {
            message: '必须为字母或数字',
            get: function(value, data, next) {
                next(/^[a-z0-9]+$/i.test(value))
                return value
            }
        },
        alpha_dash: {
            message: '必须为字母或数字及下划线等特殊字符',
            validate: function(value, data, next) {
                next(/^[a-z0-9_\-]+$/i.test(value))
                return value
            }
        },
        chs_numeric: {
            message: '必须是中文字符或数字及下划线等特殊字符',
            get: function(value, data, next) {
                next(/^[\\u4E00-\\u9FFF0-9_\-]+$/i.test(value))
                return value
            }
        },
        email: {
            message: "邮件地址错误",
            get: function(value, data, next) {
                next(/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(value))
                return value
            }
        },
        url: {
            message: "URL格式错误",
            get: function(value, data, next) {
                next(/^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/.test(value))
                return value
            }
        },
        date: {
            message: '必须符合日期格式 YYYY-MM-DD',
            get: function(value, data, next) {
                next(/^\d\d\d\d\-\d\d\-\d\d$/.test(value))
                return value
            }
        },
        passport: {
            message: '护照格式错误或过长',
            get: function(value, data, next) {
                next(/^[a-zA-Z0-9]{0,20}$/i.test(value))
                return value
            }
        },
        minlength: {
            message: '最少输入{{min}}个字',
            get: function(value, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("minlength"), 10)
                if (!isFinite(a)) {
                    a = parseInt(elem.getAttribute("data-duplex-minlength"), 10)
                }
                var num = data.data.min = a
                next(value.length >= num)
                return value
            }
        },
        maxlength: {
            message: '最多输入{{max}}个字',
            get: function(value, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("maxlength"), 10)
                if (!isFinite(a)) {
                    a = parseInt(elem.getAttribute("data-duplex-maxlength"), 10)
                }
                var num = data.data.max = a
                next(value.length <= num)
                return value
            }
        },
        gt: {
            message: '必须大于{{max}}',
            get: function(value, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("max"), 10)
                if (!isFinite(a)) {
                    a = parseInt(elem.getAttribute("data-duplex-gt"), 10)
                }
                var num = data.data.max = a
                next(parseFloat(value) > num)
                return value
            }
        },
        lt: {
            message: '必须小于{{min}}',
            get: function(value, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("min"), 10)
                if (!isFinite(a)) {
                    a = parseInt(elem.getAttribute("data-duplex-lt"), 10)
                }
                var num = data.data.min = a
                next(parseFloat(value) < num)
                return value
            }
        },
        eq: {
            message: '必须等于{{eq}}',
            get: function(value, data, next) {
                var elem = data.element
                var a = parseInt(elem.getAttribute("data-duplex-eq"), 10)
                var num = data.data.eq = a
                next(parseFloat(value) == num)
                return value
            }
        },
        pattern: {
            message: '必须匹配/{{pattern}}/这样的格式',
            get: function(value, data, next) {
                var elem = data.element
                var h5pattern = elem.getAttribute("pattern")
                var mspattern = elem.getAttribute("data-duplex-pattern")
                var pattern = data.data.pattern = h5pattern || mspattern
                var re = new RegExp('^(?:' + pattern + ')$')
                next(re.test(value))
                return value
            }
        }
    })
//<input type="number" max=x min=y step=z/> <input type="range" max=x min=y step=z/>
//
    var widget = avalon.ui.validation = function(element, data, vmodels) {
        var options = data.validationOptions
        var onSubmitCallback
        var vmodel = avalon.define(data.validationId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["widgetElement", "elements", "validationHooks"]
            vm.widgetElement = element
            vm.elements = []
            vm.$init = function() {
                element.setAttribute("novalidate", "novalidate");
                avalon.scan(element, [vmodel].concat(vmodels))
                onSubmitCallback = avalon.bind(element, "submit", function(e) {
                    e.preventDefault()
                    vm.validateAll(vm.onValidateAll)
                })
                if (typeof options.onInit === "function") { //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$destory = function() {
                vm.elements = []
                avalon.unbind(element, "submit", onSubmitCallback)
                element.textContent = element.innerHTML = ""
            }
            //重写框架内部的pipe方法
            vm.pipe = function(val, data, action, inSubmit) {
                var inwardHooks = vmodel.validationHooks
                var globalHooks = avalon.duplexHooks
                var promises = []
                var elem = data.element
                data.param.replace(/\w+/g, function(name) {
                    var hook = inwardHooks[name] || globalHooks[name]
                    if (hook && typeof hook[action] === "function") {
                        data.data = {}
                        if (!elem.disabled && hook.message) {
                            var resolve, reject
                            promises.push(new Promise(function(a, b) {
                                resolve = a
                                reject = b
                            }))
                            var next = function(a) {
                                if (a) {
                                    resolve(true)
                                } else {
                                    var reason = {
                                        element: element,
                                        data: data.data,
                                        message: hook.message,
                                        validateRule: name,
                                        getMessage: getMessage
                                    }
                                    resolve(reason)
                                }
                            }
                        } else {
                            var next = avalon.noop
                        }
                        val = hook[action](val, data, next)
                    }
                })
                if (promises.length) {//如果promises不为空，说明经过验证拦截器
                    var lastPromise = Promise.all(promises).then(function(array) {
                        if (!inSubmit) {
                            var reasons = []
                            for (var i = 0, el; el = array[i++]; ) {
                                if (typeof el === "object") {
                                    reasons.push(el)
                                }
                            }
                            if (reasons.length) {
                                vm.onError(false, reasons)
                            } else {
                                vm.onSuccess(true, reasons)
                            }
                            vm.onComplete(true)
                        }
                        return reasons
                    })
                    if (inSubmit) {
                        return lastPromise
                    }
                }
                return val
            }
            vm.validateAll = function(callback) {
                var promise = vm.elements.map(function(el) {
                    return  vm.pipe(avalon(el).val(), el, "get", true)
                })
                Promise.all(promise).then(function(array) {
                    var reasons = []
                    for (var i = 0, el; el = array[i++]; ) {
                        reasons = reasons.concat(array)
                    }
                    callback(!reasons.length, reasons)//这里只放置未通过验证的组件
                })
            }
            //收集下方表单元素的数据
            vm.$watch("init-ms-duplex", function(data) {
                if (typeof data.pipe !== "function" && avalon.contains(element, data.element)) {
                    data.pipe = vm.pipe
                    vm.elements.push(data)
                    return false
                }
            })
        })

        return vmodel
    }
    var rformat = /\\?{([^{}]+)\}/gm
    function getMessage() {
        var data = this.data || {}
        return this.message.replace(rformat, function(_, name) {
            return data[name] || ""
        })
    }
    widget.defaults = {
        validationHooks: {},
        onSuccess: function() {
        },
        onError: function() {
        },
        onComplete: function() {
        },
        onValidateAll: function() {
        }
    }
//http://bootstrapvalidator.com/
//https://github.com/rinh/jvalidator/blob/master/src/index.js
})