var rchangeFilter = /\|\s*change\b/
var rcheckedType = /^(?:checkbox|radio)$/
var rdebounceFilter = /\|\s*debounce(?:\(([^)]+)\))?/
var rnoduplexInput = /^(file|button|reset|submit|checkbox|radio|range)$/

function newControl(binding, vnode) {
    var expr = binding.expr
    var etype = vnode.props.type
    //处理数据转换器
    var ptype = binding.param
    var isChecked = ptype === 'checked'

    var ctrl = vnode.ctrl = {
        parsers: [],
        formatters: [],
        modelValue: NaN,
        viewValue: NaN,
        validators: '',
        parse: parse,
        format: format
    }
    if (isChecked) {
        if (rcheckedType.test(etype)) {
            ctrl.isChecked = true
            ctrl.type = 'radio'
        } else {
            ptype = null
        }
    }
    var changed = vnode.props['data-duplex-changed']
    if (changed) {
        var cid = changed+':cb'
        if(!avalon.caches[cid]){
            var fn = Function('return '+ avalon.parseExpr(changed, 'on'))
            avalon.caches[cid] = ctrl.callback = fn()
        }else{
            ctrl.callback = avalon.caches[cid]
        }
    }
    var parser = avalon.parsers[ptype]
    if (parser) {
        ctrl.parsers.push(parser)
    }
    if (rchangeFilter.test(expr)) {
        expr = expr.replace(rchangeFilter, '')
        if (rnoduplexInput.test(etype)) {
            avalon.warn(etype + '不支持change过滤器')
        } else {
            ctrl.isChanged = true
        }
    }

    var match = expr.match(rdebounceFilter)
    if (match) {
        expr = expr.replace(rdebounceFilter, '')
        if (!ctrl.isChanged) {
            ctrl.debounceTime = parseInt(match[1], 10) || 300
        }
    }
    binding.expr = ctrl.expr = expr.trim()
    if (!/input|textarea|select/.test(vnode.type)) {
        if ('contenteditable' in vnode.props) {
            ctrl.type = 'contenteditable'
        }
    } else if (!ctrl.type) {
        ctrl.type = vnode.type === 'select' ? 'select' :
                etype === 'checkbox' ? 'checkbox' :
                etype === 'radio' ? 'radio' :
                'input'
    }
    avalon.parseExpr(binding, 'duplex')
}

function parse(val) {
    for (var i = 0, fn; fn = this.parsers[i++]; ) {
        val = fn.call(this, val)
    }
    return val
}

function format(val) {
    var formatters = this.formatters
    var index = formatters.length
    while (index--) {
        val = formatters[index](val)
    }
    return val
}

module.exports = newControl
