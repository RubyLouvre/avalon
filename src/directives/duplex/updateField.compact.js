
var updateField = {
    input: function () {//处理单个value值处理
        this.element.value = this.viewValue
    },
    radio: function () {//处理单个checked属性
        var checked
        if (this.isChecked) {
            checked = !!this.viewValue
        } else {
            checked = this.viewValue + '' === this.element.value
        }
        var element = this.element
        if (avalon.msie === 6) {
            setTimeout(function () {
                //IE8 checkbox, radio是使用defaultChecked控制选中状态，
                //并且要先设置defaultChecked后设置checked
                //并且必须设置延迟
                element.defaultChecked = checked
                element.checked = checked
            }, 31)
        } else {
            element.checked = checked
        }
    },
    checkbox: function () {//处理多个checked属性
        var checked = false
        var element = this.element
        var value = element.value
        for (var i = 0; i < this.modelValue.length; i++) {
            var el = this.modelValue[i]
            if (el + '' === value) {
                checked = true
            }
        }
        element.checked = checked
    },
    select: function () {//处理子级的selected属性
        var a = Array.isArray(this.viewValue) ? this.viewValue.map(String): this.viewValue+''
        avalon(this.element).val(a)
    },
    contenteditable: function () {//处理单个innerHTML
        this.element.innerHTML = this.viewValue
        this.update.call(this.element)
    }
}

module.exports = updateField