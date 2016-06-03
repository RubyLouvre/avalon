var updateModelMethods = {
    input: function (prop) {//处理单个value值处理
        var field = this
        prop = prop || 'value'
        var rawValue = field.element[prop]

        var formatedValue = field.format(rawValue)

        if (formatedValue !== field.viewValue) {
            var parsedValue = parseValue(field, formatedValue)
            if (parsedValue !== field.modelValue) {
                field.set(field.vmodel, parsedValue)
                callback(field)
            }
            field.formatedValue = formatedValue
            field.element[prop] = formatedValue
        }

        //vm.aaa = '1234567890'
        //处理 <input ms-duplex='@aaa|limitBy(8)'/>{{@aaa}} 这种格式化同步不一致的情况 

    },
    radio: function () {
        var field = this
        if (field.isChecked) {
            var val = field.modelValue = !field.modelValue
            field.set(field.vmodel, val)
            callback(field)
        } else {
            updateModelMethods.input.call(field)
        }
    },
    checkbox: function () {
        var field = this
        var array = field.modelValue
        if (!Array.isArray(array)) {
            avalon.warn('ms-duplex应用于checkbox上要对应一个数组')
            array = [array]
        }
        var method = field.element.checked ? 'ensure' : 'remove'
        if (array[method]) {
            var val = field.parse(field.element.value)
            array[method](val)
            callback(field)
        }

    },
    select: function () {
        var field = this
        var val = avalon(field.element).val() //字符串或字符串数组
        if (val + '' !== this.modelValue + '') {
            if (Array.isArray(val)) { //转换布尔数组或其他
                val = val.map(function (v) {
                    return parseValue(field, v)
                })
            } else {
                val = parseValue(field, val)
            }
            field.modelValue = val
            field.set(field.vmodel, val)
            callback(field)
        }
    },
    contenteditable: function () {
        updateModelMethods.input.call(this, 'innerHTML')
    }
}

function callback(field) {
    if (field.validator) {
        avalon.directives.validate.validate(field, false)
    }
    if (field.callback) {
        field.callback.call(field.vmodel, {
            type: 'changed',
            target: field.element
        })
    }
}

function parseValue(filed, val) {
    for (var i = 0, fn; fn = filed.parsers[i++]; ) {
        val = fn.call(filed, val)
    }
    return val
}

module.exports = updateModelMethods
