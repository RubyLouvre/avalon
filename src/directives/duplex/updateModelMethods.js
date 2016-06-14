var updateModelMethods = {
    input: function (prop) {//处理单个value值处理
        var data = this
        prop = prop || 'value'
        var rawValue = data.element[prop]
        var formatedValue = data.format(data.vmodel, rawValue)
        if (formatedValue !== rawValue) {
            data.formatedValue = formatedValue
            data.element[prop] = formatedValue
        }
        
        var parsedValue = data.parse(formatedValue)
        if (parsedValue !== data.modelValue) {
            data.set(data.vmodel, parsedValue)
            callback(data)
        }

        //vm.aaa = '1234567890'
        //处理 <input ms-duplex='@aaa|limitBy(8)'/>{{@aaa}} 这种格式化同步不一致的情况 

    },
    radio: function () {
        var data = this
        if (data.isChecked) {
            var val = data.modelValue = !data.modelValue
            data.set(data.vmodel, val)
            callback(data)
        } else {
            updateModelMethods.input.call(data)
        }
    },
    checkbox: function () {
        var data = this
        var array = data.modelValue
        if (!Array.isArray(array)) {
            avalon.warn('ms-duplex应用于checkbox上要对应一个数组')
            array = [array]
        }
        var method = data.element.checked ? 'ensure' : 'remove'
        
        if (array[method]) {
            var val = data.parse(data.element.value)
            array[method](val)
            callback(data)
        }

    },
    select: function () {
        var data = this
        var val = avalon(data.element).val() //字符串或字符串数组
        if (val + '' !== this.modelValue + '') {
            if (Array.isArray(val)) { //转换布尔数组或其他
                val = val.map(function (v) {
                    return data.parse(v)
                })
            } else {
                val = data.parse(val)
            }
            data.modelValue = val
            data.set(data.vmodel, val)
            callback(data)
        }
    },
    contenteditable: function () {
        updateModelMethods.input.call(this, 'innerHTML')
    }
}

function callback(data) {
//    if (data.validator) {
//        avalon.directives.validate.validate(data, false)
//    }
    if (data.callback) {
        data.callback.call(data.vmodel, {
            type: 'changed',
            target: data.element
        })
    }
}



module.exports = updateModelMethods
