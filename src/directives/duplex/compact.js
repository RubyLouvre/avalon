var msie = avalon.msie
var quote = avalon.quote

var valueHijack = require('./valueHijack')
var refreshView = require('./refreshView.compact')
var initMonitor = require('./initMonitor.compact')

var rchangeFilter = /\|\s*change\b/
var rcheckedType = /^(?:checkbox|radio)$/
var rnoduplexInput = /^(file|button|reset|submit|checkbox|radio|range)$/

avalon.directive('duplex', {
    priority: 2000,
    parse: function (binding, num, elem) {
        var expr = binding.expr
        var etype = elem.props.type
        //处理数据转换器
        var ptype = binding.param
        var isChecked = ptype === 'checked'


        var ctrl = elem.ctrl = {
            parsers: [],
            formatters: [],
            modelValue: NaN,
            viewValue: NaN,
            type: 'input',
            expr: expr,
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

        if (!/input|textarea|select/.test(etype)) {
            if ('contenteditable' in elem.props) {
                ctrl.type = 'contenteditable'
            }
        } else if (ctrl.type) {
            ctrl.type = etype === 'select' ? 'select' :
                    etype === 'checkbox' ? 'checkbox' :
                    etype === 'radio' ? 'radio' :
                    'input'
        }

        avalon.parseExpr(ctrl, 'duplex')
        return 'vnode' + num + '.duplexVm = __vmodel__;\n' +
                'vnode' + num + '.props["a-duplex"] = ' + quote(ctrl.expr) + ';\n'
    },
    diff: function (cur, pre) {
        if (pre.ctrl && pre.ctrl.set) {
            cur.ctrl = pre.ctrl
        } else {
            if (!cur.type === 'select' && cur.children.length) {
                avalon.Array.merge(cur.children, avalon.lexer(cur.template))
            }
            initMonitor(cur, pre)
        }

        var ctrl = cur.ctrl
        delete cur.duplexVm

        var value = cur.props.value = ctrl.get(ctrl.vmodel)
        if (!ctrl.elem) {
            var isEqual = false
        } else {
            var preValue = pre.props.value
            if (Array.isArray(value)) {
                isEqual = value + '' === preValue + ''
            } else {
                isEqual = value === preValue
            }
        }

        if (!isEqual) {
            ctrl.modelValue = value
            var afterChange = cur.afterChange || (cur.afterChange = [])
            avalon.Array.ensure(afterChange, this.update)
        }
    },
    update: function (node, vnode) {
        var ctrl = node.__duplex__ = vnode.ctrl
        if (!ctrl.elem) {//这是一次性绑定
            ctrl.elem = node //方便进行垃圾回收
            var events = ctrl.events
            for (var name in events) {
                avalon.bind(node, name, events[name])
                delete events[name]
            }
        }

        if (!msie && valueHijack === false && !node.valueHijack) {
            //chrome 42及以下版本需要这个hack
            node.valueHijack = ctrl.update
            var intervalID = setInterval(function () {
                if (!avalon.contains(avalon.root, node)) {
                    clearInterval(intervalID)
                } else {
                    node.valueHijack()
                }
            }, 30)
        }

        var viewValue = ctrl.format(ctrl.modelValue)

        if (ctrl.viewValue !== viewValue) {
            ctrl.viewValue = viewValue
            refreshView[ctrl.type].call(ctrl)
            if (node.caret) {
                ctrl.updateCaret(node, ctrl.caretPos, ctrl.caretPos)
            }
        }
    }
})

function parse(val) {
    for (var i = 0, fn; fn = this.parsers[i++]; ) {
        val = fn.call(this, val)
    }
    return val
}

function format(val) {
    //当数据转换器为checked时,一切格式化过滤器都失效
    if (this.isChecked)
        return val
    var formatters = this.formatters
    var index = formatters.length
    while (index--) {
        val = formatters[index](val)
    }
    return val
}



