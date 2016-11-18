import { avalon, isObject, platform} from '../seed/core'

avalon.directive('rules', {
    diff: function (rules) {
        if (isObject(rules)) {
            var vdom = this.node
            vdom.rules = platform.toJson(rules)
            if (vdom.duplex) {
                vdom.duplex.rules = vdom.rules
            }
            return true
        }
    }
})
function isRegExp(value) {
    return avalon.type(value) === 'regexp'
}
var rmail = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/i
var rurl = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/
function isCorrectDate(value) {
    if (typeof value === "string" && value) { //是字符串但不能是空字符
        var arr = value.split("-") //可以被-切成3份，并且第1个是4个字符
        if (arr.length === 3 && arr[0].length === 4) {
            var year = ~~arr[0] //全部转换为非负整数
            var month = ~~arr[1] - 1
            var date = ~~arr[2]
            var d = new Date(year, month, date)
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === date
        }
    }
    return false
}
//https://github.com/adform/validator.js/blob/master/validator.js
avalon.shadowCopy(avalon.validators, {
    pattern: {
        message: '必须匹配{{pattern}}这样的格式',
        get: function (value, field, next) {
            var elem = field.dom
            var data = field.data
            if (!isRegExp(data.pattern)) {
                var h5pattern = elem.getAttribute("pattern")
                data.pattern = new RegExp('^(?:' + h5pattern + ')$')
            }
            next(data.pattern.test(value))
            return value
        }
    },
    digits: {
        message: '必须整数',
        get: function (value, field, next) {//整数
            next(/^\-?\d+$/.test(value))
            return value
        }
    },
    number: {
        message: '必须数字',
        get: function (value, field, next) {//数值
            next(!!value && isFinite(value))// isFinite('') --> true
            return value
        }
    },
    norequired: {
        message: '',
        get: function (value, field, next) {
            next(true)
            return value
        }
    },
    required: {
        message: '必须填写',
        get: function (value, field, next) {
            next(value !== '')
            return value
        }
    },
    equalto: {
        message: '密码输入不一致',
        get: function (value, field, next) {
            var id = String(field.data.equalto)
            var other = avalon(document.getElementById(id)).val() || ""
            next(value === other)
            return value
        }
    },
    date: {
        message: '日期格式不正确',
        get: function (value, field, next) {
            var data = field.data
            if (isRegExp(data.date)) {
                next(data.date.test(value))
            } else {
                next(isCorrectDate(value))
            }
            return value
        }
    },
    url: {
        message: 'URL格式不正确',
        get: function (value, field, next) {
            next(rurl.test(value))
            return value
        }
    },
    email: {
        message: 'email格式不正确',
        get: function (value, field, next) {
            next(rmail.test(value))
            return value
        }
    },
    minlength: {
        message: '最少输入{{minlength}}个字',
        get: function (value, field, next) {
            var num = parseInt(field.data.minlength, 10)
            next(value.length >= num)
            return value
        }
    },
    maxlength: {
        message: '最多输入{{maxlength}}个字',
        get: function (value, field, next) {
            var num = parseInt(field.data.maxlength, 10)
            next(value.length <= num)
            return value
        }
    },
    min: {
        message: '输入值不能小于{{min}}',
        get: function (value, field, next) {
            var num = parseInt(field.data.min, 10)
            next(parseFloat(value) >= num)
            return value
        }
    },
    max: {
        message: '输入值不能大于{{max}}',
        get: function (value, field, next) {
            var num = parseInt(field.data.max, 10)
            next(parseFloat(value) <= num)
            return value
        }
    },
    chs: {
        message: '必须是中文字符',
        get: function (value, field, next) {
            next(/^[\u4e00-\u9fa5]+$/.test(value))
            return value
        }
    }
})