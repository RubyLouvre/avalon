import { updateDataActions } from './updateDataActions'

export function updateDataHandle(event) {
    var elem = this
    var field = elem._ms_duplex_
    if (elem.composing) {
        //防止onpropertychange引发爆栈
        return
    }
    if (elem.value === field.value) {
        return
    }
    /* istanbul ignore if*/
    if (elem.caret) {
        try {
            var pos = field.getCaret(elem)
            field.pos = pos
        } catch (e) {}
    }
    /* istanbul ignore if*/
    if (field.debounceTime > 4) {
        var timestamp = new Date()
        var left = timestamp - field.time || 0
        field.time = timestamp
            /* istanbul ignore if*/
        if (left >= field.debounceTime) {
            updateDataActions[field.dtype].call(field)
                /* istanbul ignore else*/
        } else {
            clearTimeout(field.debounceID)
            field.debounceID = setTimeout(function() {
                updateDataActions[field.dtype].call(field)
            }, left)
        }
    } else {
        updateDataActions[field.dtype].call(field)
    }
}

export {
    updateDataHandle as updateModel
}