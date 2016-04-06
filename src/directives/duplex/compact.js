
var valueHijack = require('./valueHijack')

var newControl = require('./newControl')
var initControl = require('./bindEvents.compact')
var refreshControl = require('./refreshControl.compact')


avalon.directive('duplex', {
    priority: 2000,
    parse: function (binding, num, vnode) {
        newControl(binding, vnode)
        return 'vnode' + num + '.duplexVm = __vmodel__;\n' +
                'vnode' + num + '.props["ms-duplex"] = ' + avalon.quote(binding.expr) + ';\n'
    },
    diff: function (cur, pre, steps) {

        if (pre.ctrl && pre.ctrl.set) {
            cur.ctrl = pre.ctrl
            pre.ctrl = null
        } else {
            initControl(cur, pre)
        }

        var ctrl = cur.ctrl
        cur.duplexVm = null
        var value = cur.props.value = ctrl.get(ctrl.vmodel)

        if (cur.type === 'select' && !cur.children.length) {
            avalon.Array.merge(cur.children, avalon.lexer(cur.template, 0, 2))
            fixVirtualOptionSelected(cur, value)
        }

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
            steps.count += 1
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

        if (!avalon.msie && valueHijack === false && !node.valueHijack) {
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
            refreshControl[ctrl.type].call(ctrl)
            if (node.caret) {
                var pos = ctrl.caretPos
                pos && ctrl.updateCaret(node, pos.start, pos.end)
                ctrl.caretPos = null
            }
        }
    }
})


function fixVirtualOptionSelected(cur, curValue) {
    var options = []
    cur.children.forEach(function (a) {
        if (a.type === 'option') {
            options.push(a)
        } else if (a.type === 'optgroup') {
            a.children.forEach(function (c) {
                if (c.type === 'option') {
                    options.push(c)
                }
            })
        }
    })
    var multi = cur.props.multiple
    var map = {}
    var one = multi === null || multi === void 0 || multi === false
    if (Array.isArray(curValue)) {
        curValue.forEach(function (a) {
            map[a] = 1
        })
    } else {
        map[curValue] = 1
    }
    for (var i = 0, option; option = options[i++]; ) {
        var v = 'value' in option.props ? option.props.value :
                (option.children[0] || {nodeValue: ''}).nodeValue.trim()
        option.props.selected = !!map[v]
        if (map[v] && one) {
            break
        }
    }
}
