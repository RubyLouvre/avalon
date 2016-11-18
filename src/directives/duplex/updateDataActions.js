import { avalon } from '../../seed/core'

export var updateDataActions = {
    input: function (prop) {//处理单个value值处理
        var field = this
        prop = prop || 'value'
        var dom = field.dom
        var rawValue = dom[prop]
        var parsedValue = field.parseValue(rawValue)

        //有时候parse后一致,vm不会改变,但input里面的值
        field.value = rawValue
        field.setValue(parsedValue)
        duplexCb(field)
        var pos = field.pos
          /* istanbul ignore if */
        if (dom.caret) {
            field.setCaret(dom, pos)
        }
        //vm.aaa = '1234567890'
        //处理 <input ms-duplex='@aaa|limitBy(8)'/>{{@aaa}} 这种格式化同步不一致的情况 
    },
    radio: function () {
        var field = this
        if (field.isChecked) {
            var val = !field.value
            field.setValue(val)
            duplexCb(field)
        } else {
            updateDataActions.input.call(field)
            field.value = NaN
        }
    },
    checkbox: function () {
        var field = this
        var array = field.value
        if (!Array.isArray(array)) {
            avalon.warn('ms-duplex应用于checkbox上要对应一个数组')
            array = [array]
        }
        var method = field.dom.checked ? 'ensure' : 'remove'
        if (array[method]) {
            var val = field.parseValue(field.dom.value)
            array[method](val)
            duplexCb(field)
        }
        this.__test__ = array

    },
    select: function () {
        var field = this
        var val = avalon(field.dom).val() //字符串或字符串数组
        if (val + '' !== this.value + '') {
            if (Array.isArray(val)) { //转换布尔数组或其他
                val = val.map(function (v) {
                    return field.parseValue(v)
                })
            } else {
                val = field.parseValue(val)
            }
            field.setValue(val)
            duplexCb(field)
        }
    },
    contenteditable: function () {
        updateDataActions.input.call(this, 'innerHTML')
    }
}

function duplexCb(field) {
    if (field.userCb) {
        field.userCb.call(field.vm, {
            type: 'changed',
            target: field.dom
        })
    }
}