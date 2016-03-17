var refreshView = {
    input: function () {//处理单个value值处理
        this.elem.value = this.viewValue
    },
    radio: function () {//处理单个checked属性
        var checked
        if (this.isChecked) {
            checked = !!this.viewValue
        } else {
            checked = this.viewValue + '' === this.elem.value
        }
        this.elem.checked = checked
    },
    checkbox: function () {//处理多个checked属性
        var checked = false
        var elem = this.elem
        var value = elem.value
        for (var i = 0; i < this.modelValue.length; i++) {
            var el = this.modelValue[i]
            if (el + '' === value) {
                checked = true
            }
        }
        elem.checked = checked
    },
    select: function () {//处理子级的selected属性
        avalon(this.elem).val(this.viewValue)
    },
    contenteditable: function () {//处理单个innerHTML
        this.elem.innerHTML = this.viewValue
    }
}

module.exports = refreshView