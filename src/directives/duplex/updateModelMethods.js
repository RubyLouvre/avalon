var updateModelMethods = {
    input: function (prop) {//处理单个value值处理
        var data = this
        prop = prop || 'value'
        var dom = data.dom
        var rawValue = dom[prop]
        var parsedValue = data.parse(rawValue)

        //有时候parse后一致,vm不会改变,但input里面的值
        data.value = rawValue
        data.set(data.vmodel, parsedValue)
        callback(data)


        var pos = data.pos
        if (dom.caret) {
            data.setCaret(dom, pos)
        }
        //vm.aaa = '1234567890'
        //处理 <input ms-duplex='@aaa|limitBy(8)'/>{{@aaa}} 这种格式化同步不一致的情况 

    },
    radio: function () {
        var data = this
        if (data.isChecked) {
            var val = !data.value
            data.set(data.vmodel, val)
            callback(data)
        } else {
            updateModelMethods.input.call(data)
            data.value = NaN
        }
    },
    checkbox: function () {
        var data = this
        var array = data.value
        if (!Array.isArray(array)) {
            avalon.warn('ms-duplex应用于checkbox上要对应一个数组')
            array = [array]
        }
        var method = data.dom.checked ? 'ensure' : 'remove'
        if (array[method]) {
            var val = data.parse(data.dom.value)
            array[method](val)
            callback(data)
        }

    },
    select: function () {
        var data = this
        var val = avalon(data.dom).val() //字符串或字符串数组
        if (val + '' !== this.value + '') {
            if (Array.isArray(val)) { //转换布尔数组或其他
                val = val.map(function (v) {
                    return data.parse(v)
                })
            } else {
                val = data.parse(val)
            }
            data.set(data.vmodel, val)
            callback(data)
        }
    },
    contenteditable: function () {
        updateModelMethods.input.call(this, 'innerHTML')
    }
}

function callback(data) {
    if (data.callback) {
        data.callback.call(data.vmodel, {
            type: 'changed',
            target: data.dom
        })
    }
}



module.exports = updateModelMethods
