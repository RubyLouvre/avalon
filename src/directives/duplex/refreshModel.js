
/**
 * ------------------------------------------------------------
 * refreshModel
 * 在事件回调与value的setter中调用这些方法,来同步vm
 * ------------------------------------------------------------
 */
var refreshModel = {
    input: function (prop) {//处理单个value值处理
        var field = this
        prop = prop || 'value'
        var viewValue = field.element[prop]
        var rawValue = viewValue

        viewValue = field.format(viewValue)
        //vm.aaa = '1234567890'
        //处理 <input ms-duplex='@aaa|limitBy(8)'/>{{@aaa}} 这种格式化同步不一致的情况 
        var val = field.parse(viewValue)
        viewValue = val + ''

        if (val !== field.modelValue) {
            field.set(field.vmodel, val)
            callback(field)
        }

        if (rawValue !== viewValue) {
            field.viewValue = viewValue
            field.element[prop] = viewValue
        }

    },
    radio: function () {
        var field = this
        if (field.isChecked) {
            var val = field.modelValue = !field.modelValue
            field.set(field.vmodel, val)
            callback(field)
        } else {
            refreshModel.input.call(field)
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
                    return field.parse(v)
                })
            } else {
                val = field.parse(val)
            }
            field.modelValue = val
            field.set(field.vmodel, val)
            callback(field)
        }
    },
    contenteditable: function () {
        refreshModel.input.call(this, 'innerHTML')
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
module.exports = refreshModel