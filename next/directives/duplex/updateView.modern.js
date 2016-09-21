
var updateView = {
    input: function () {//处理单个value值处理
        this.dom.value = this.value
    },
    radio: function () {//处理单个checked属性
        var checked
        if (this.isChecked) {
            checked = !!this.value
        } else {
            checked = this.value + '' === this.dom.value
        }
        var dom = this.dom

        dom.checked = checked

    },
    checkbox: function () {//处理多个checked属性
        var checked = false
        var dom = this.dom
        var value = dom.value
        for (var i = 0; i < this.value.length; i++) {
            var el = this.value[i]
            if (el + '' === value) {
                checked = true
            }
        }
        dom.checked = checked
    },
    select: function () {//处理子级的selected属性
        var a = Array.isArray(this.value) ?
                this.value.map(String) : this.value + ''
        avalon(this.dom).val(a)
    },
    contenteditable: function () {//处理单个innerHTML
        this.dom.innerHTML = this.value
        this.update.call(this.dom)
    }
}

module.exports = updateView
