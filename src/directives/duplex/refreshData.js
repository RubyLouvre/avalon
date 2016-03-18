
/**
 * ------------------------------------------------------------
 * refreshData
 * 在事件回调与value的setter中调用这些方法,来同步vm
 * ------------------------------------------------------------
 */
var refreshData = {
    input: function () {//处理单个value值处理
        var ctrl = this
        var viewValue = ctrl.elem.value
        var rawValue = viewValue

        viewValue = ctrl.format(viewValue)
        //vm.aaa = '1234567890'
        //处理 <input ms-duplex='@aaa|limitBy(8)'/>{{@aaa}} 这种格式化同步不一致的情况 
        
        if (rawValue !== viewValue) {
            ctrl.elem.value = viewValue
        }
        var val = ctrl.parse(viewValue)
        if (val !== ctrl.modelValue) {
            ctrl.set(ctrl.vmodel, val)
        }
       
    },
    radio: function () {
        var ctrl = this
        if (ctrl.isChecked) {
            var val = ctrl.modelValue = !ctrl.modelValue
            ctrl.set(ctrl.vmodel, val)
        } else {
            refreshData.input.call(ctrl)
        }
    },
    checkbox: function () {
        var ctrl = this
        var array = ctrl.modelValue
        if (!Array.isArray(array)) {
            avalon.warn('ms-duplex应用于checkbox上要对应一个数组')
            array = [array]
        }
        var method = ctrl.elem.checked ? 'ensure' : 'remove'
        if (array[method]) {
            var val = ctrl.parse(ctrl.elem.value)
            array[method](val)
        }

    },
    select: function () {
        var ctrl = this
        var val = avalon(ctrl.elem).val() //字符串或字符串数组
        if (val + '' !== this.modelValue + '') {
            if (Array.isArray(val)) { //转换布尔数组或其他
                val = val.map(function (v) {
                    return ctrl.parse(v)
                })
            } else {
                val = ctrl.parse(val)
            }
            ctrl.modelValue = val
            ctrl.set(ctrl.vmodel, val)
        }
    },
    contenteditable: function () {
        var ctrl = this
        var val = ctrl.parse(ctrl.elem.innerHTML)
        if (val !== ctrl.modelValue) {
            ctrl.modelValue = val
            ctrl.set(ctrl.vmodel, val)
        }
    }
}
module.exports = refreshData