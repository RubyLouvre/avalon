var updateModelMethods = require('./updateModelMethods')

function updateModelHandle(e) {
    var elem = this
    var field = this.__ms_duplex__
    if (elem.composing || elem.value === field.lastViewValue){
        //防止onpropertychange引发爆栈
        return
    }
   if (elem.caret) {
        try {
            var pos = field.getCaret(elem)
            field.pos = pos
        } catch (e) {
            avalon.warn('fixCaret error', e)
        }
    }
    if (field.debounceTime > 4) {
        var timestamp = new Date()
        var left = timestamp - field.time || 0
        field.time = timestamp
        if (left >= field.debounceTime) {
            updateModelMethods[field.type].call(field)
        } else {
            clearTimeout(field.debounceID)
            field.debounceID = setTimeout(function () {
                updateModelMethods[field.type].call(field)
            }, left)
        }
    } else {
        updateModelMethods[field.type].call(field)
    }
}

module.exports = updateModelHandle