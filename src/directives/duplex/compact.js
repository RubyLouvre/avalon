

var valueHijack = require('./valueHijack')

var newControl = require('./newControl')
var initControl = require('./initControl.compact')
var refreshControl = require('./refreshControl.compact')


avalon.directive('duplex', {
    priority: 2000,
    parse: function (binding, num, vnode) {
        newControl(binding, vnode)
        return 'vnode' + num + '.duplexVm = __vmodel__;\n' +
                'vnode' + num + '.props["a-duplex"] = ' + avalon.quote(binding.expr) + ';\n'
    },
    diff: function (cur, pre) {
        if (pre.ctrl && pre.ctrl.set) {
            cur.ctrl = pre.ctrl
        } else {
            if (!cur.type === 'select' && cur.children.length) {
                avalon.Array.merge(cur.children, avalon.lexer(cur.template))
            }
            initControl(cur, pre)
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
        var viewValue = ctrl.modelValue
        if (ctrl.viewValue !== viewValue) {
            ctrl.viewValue = viewValue
            refreshControl[ctrl.type].call(ctrl)
            if (node.caret) {
                ctrl.updateCaret(node, ctrl.caretPos, ctrl.caretPos)
            }
        }
    }
})



