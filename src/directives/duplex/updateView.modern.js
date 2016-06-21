
var updateView = {
    input: function () {//处理单个value值处理
        this.dom.value = this.viewValue
    },
    radio: function () {//处理单个checked属性
        var checked
        if (this.isChecked) {
            checked = !!this.viewValue
        } else {
            checked = this.viewValue + '' === this.dom.value
        }
        var dom = this.dom

        dom.checked = checked

    },
    checkbox: function () {//处理多个checked属性
        var checked = false
        var dom = this.dom
        var value = dom.value
        for (var i = 0; i < this.modelValue.length; i++) {
            var el = this.modelValue[i]
            if (el + '' === value) {
                checked = true
            }
        }
        dom.checked = checked
    },
    select: function () {//处理子级的selected属性
        var a = Array.isArray(this.viewValue) ?
                this.viewValue.map(String) : this.viewValue + ''
        avalon(this.dom).val(a)
    },
    contenteditable: function () {//处理单个innerHTML
        this.dom.innerHTML = this.viewValue
        this.update.call(this.dom)
    }
}

module.exports = updateView
