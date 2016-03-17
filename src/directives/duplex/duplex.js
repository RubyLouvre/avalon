avalon.directive('duplex', {
    priority: 2000,
    parse: function (binding, num, elem) {
        var expr = binding.expr
        var etype = elem.props.type
        //处理数据转换器
        var ptype = binding.param
        var isChecked = ptype === 'checked'
        var parsers = avalon.parsers
        var parser = parsers[ptype]
        if (!rcheckedType.test(etype) && isChecked) {
            parser = null
            isChecked = false
        }
        if (!parser) {
            parser = parsers.string
        }

        if (rchangeFilter.test(expr)) {
            if (rnoduplexInput.test(etype)) {
                avalon.warn(etype + '不支持change过滤器')
            } else {
                var isChanged = true
            }
            expr = expr.replace(rchangeFilter, '')
        }

        var ctrl = elem.ctrl = {
            $parsers: [parser],
            $formatters: [],
            $modelValue: NaN,
            $viewValue: NaN,
            $type: 'input',
            $render: avalon.noop,
            expr: expr,
            isChanged: isChanged,
            isChecked: isChecked
        }


        if (/input|textarea|select/.test(etype)) {
            if ('contenteditable' in elem.props) {
                ctrl.$type = 'contenteditable'
            }
        } else {
            ctrl.$type = etype === 'select' ? 'select' :
                    etype === 'checkbox' ? 'checkbox' :
                    etype === 'radio' ? 'radio' :
                    'input'
        }
        if (ctrl.$type) {
            ctrl.$render = $renders[ctrl.$type]
        }
        avalon.parseExpr(ctrl, 'duplex')
        return 'vnode' + num + '.duplexVm = __vmodel__;\n' +
                // 'vnode' + num + '.props.itype = ' + quote(itype) + ';\n' +
                'vnode' + num + '.props["a-duplex"] = ' + quote(ctrl.expr) + ';\n'
    },
    diff: function (cur, pre) {
        if (pre.ctrl && pre.ctrl.set) {
            cur.ctrl = pre.ctrl
        } else {
            if (!cur.type === 'select' && cur.children.length) {
                pushArray(cur.children, avalon.lexer(cur.template))
            }
            initDuplexCtrl(cur, pre)
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
            ctrl.$modelValue = value
            var afterChange = cur.afterChange || (cur.afterChange = [])
            if (cur.type === 'select') {
                avalon.Array.ensure(afterChange, this.update)
            }
            avalon.Array.ensure(afterChange, this.update)
            //  var list = cur.change || (cur.change = [])
            //  avalon.Array.ensure(list, this.update)
        }

    },
    update: function (node, vnode) {
        var ctrl = node.__duplex__ = vnode.ctrl


        if (!ctrl.elem) {//这是一次性绑定
            ctrl.elem = node //方便进行垃圾回收
            var $events = ctrl.$events
            for (var name in $events) {
                avalon.bind(node, name, $events[name])
                delete $events[name]
            }
            if (ctrl.watchValueInTimer) {//chrome 42及以下版本需要这个hack
                node.valueSet = updateModel //#765
                watchValueInTimer(function () {
                    if (!vnode.disposed) {
                        if (!node.msFocus) {
                            node.valueSet()
                        }
                    } else {
                        return false
                    }
                })
                delete ctrl.watchValueInTimer
            }
        }

        var formatters = ctrl.$formatters,
                idx = formatters.length

        var viewValue = ctrl.$modelValue

        while (idx--) {
            viewValue = formatters[idx](viewValue)
        }
        if (ctrl.$viewValue !== viewValue) {

            ctrl.$viewValue = ctrl.$$lastCommittedViewValue = viewValue
            ctrl.$render()
            if (node.caret) {
                ctrl.hasFocus()
            }
        }
    }
})




var updateViews = {
    input: function () {//处理单个value值处理
        this.elem.value = this.$viewValue
    },
    radio: function () {//处理单个checked属性
        var checked = this.$viewValue
        var node = this.elem
        if (msie === 6) {
            setTimeout(function () {
                //IE8 checkbox, radio是使用defaultChecked控制选中状态，
                //并且要先设置defaultChecked后设置checked
                //并且必须设置延迟
                node.defaultChecked = checked
                node.checked = checked
            }, 31)
        } else {
            node.checked = checked
        }
    },
    checkbox: function () {//处理多个checked属性
        var node = this.elem
        var modelValue = node.value
        for (var i = 0; i < this.$parsers.length; i++) {
            modelValue = this.$parsers[i](modelValue)
        }
        node.checked = this.$modelValue.indexOf(modelValue)
    },
    select: function () {//处理子级的selected属性
        avalon(this.elem).val(this.$modelValue)
    },
    contenteditable: function () {//处理单个innerHTML
        this.elem.innerHTML = this.$viewValue
    }
}

var updateModels = {
    input: function () {//处理单个value值处理
        var ctrl = this
        var modelValue = ctrl.parse(ctrl.elem.value)

        if (modelValue !== ctrl.$modelValue) {
            ctrl.setter(ctrl.vmodel, modelValue)
        }
    },
    radio: function () {
        var ctrl = this
        if (ctrl.checked) {
            ctrl.setter(ctrl.vmodel, !ctrl.$modelValue)
        } else {
            updateModels.input.call(this)
        }
    },
    checkbox: function () {
        var ctrl = this
        if (ctrl.isChecked) {
            ctrl.setter(ctrl.vmodel, !ctrl.$modelValue)
        } else {
            var array = this.$modelValue
            if (!Array.isArray(array)) {
                avalon.warn('ms-duplex应用于checkbox上要对应一个数组')
                array = [array]
            }
            var method = this.elem.checked ? 'ensure' : 'remove'
            if (array[method]) {
                var modelValue = this.elem.value
                for (var i = 0; i < ctrl.$parsers.length; i++) {
                    modelValue = ctrl.$parsers[i](modelValue)
                }
                array[method](modelValue)
            }
        }
    },
    select: function () {

    },
    contenteditable: function () {
        var ctrl = this
        var modelValue = ctrl.elem.innerHTML
        for (var i = 0; i < ctrl.$parsers.length; i++) {
            modelValue = ctrl.$parsers[i](modelValue)
        }
        if (modelValue !== ctrl.$modelValue) {
            ctrl.setter(ctrl.vmodel, modelValue)
        }
    }
}


function initDuplexCtrl(cur, pre) {
    var ctrl = cur.ctrl = pre.ctrl
    var $events = ctrl.$events = {}
    //添加需要监听的事件
    switch (ctrl.$type) {
        case 'radio':
            $events.click = updateModel
            break
        case 'checkbox':
            $events[msie < 9 ? 'click' : 'change'] = updateModel
            break
        case 'select':
            $events.change = updateModel
            break
        case 'contenteditable':
            $events.change = updateModel
            break
        case 'input':
            if (ctrl.isChanged) {
                $events.change = updateModel
            } else {
                if (!msie) { // W3C
                    $events.input = updateModel
                    $events.compositionstart = openComposition
                    $events.compositionend = closeComposition
                    $events.DOMAutoComplete = updateModel
                } else {
                    // IE下通过selectionchange事件监听IE9+点击input右边的X的清空行为，及粘贴，剪切，删除行为
                    if (msie > 8) {
                        if (msie === 9) {
                            //IE9删除字符后再失去焦点不会同步 #1167
                            $events.keyup = updateModel
                        }
                        //IE9使用propertychange无法监听中文输入改动
                        $events.input = updateModel
                    } else {
                        //onpropertychange事件无法区分是程序触发还是用户触发
                        //IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
                        $events.propertychange = updateModelHack
                    }
                    $events.dragend = updateModelDelay
                    //http://www.cnblogs.com/rubylouvre/archive/2013/02/17/2914604.html
                    //http://www.matts411.com/post/internet-explorer-9-oninput/
                }
            }

            break
    }
    if (ctrl.$type === 'input' && !rnoduplexInput.test(cur.props.type)) {
        if (cur.props.type !== 'hidden') {
            $events.focus = openCaret
            $events.blur = closeCaret
        }
        cur.watchValueInTimer = true
    }

}

//http://www.hbcms.com/main/dhtml/properties/iscontenteditable.html

avalon.parsers = {
    number: function (ctrl) {
        return parseFloat(ctrl.$viewValue)
    },
    string: function (ctrl) {
        return ctrl.$viewValue == null ? '' : ctrl.$viewValue + ''
    },
    boolean: function (ctrl) {
        return ctrl.$viewValue === 'true'
    },
    checked: function (ctrl) {
        return !ctrl.$modelValue
    }
}

function updateModelHack(e) {
    if (e.propertyName === 'value') {
        updateModel.call(this, e)
    }
}

function updateModelDelay(e) {
    var elem = this
    setTimeout(function () {
        updateModel.call(elem, e)
    }, 17)
}

function updateModel() {
    var elem = this, fixCaret
    var ctrl = this.__duplex__
    var modelValue = elem.value //防止递归调用形成死循环
    if (elem.composing)
        return
    if (elem.caret) {

    }
    var update = updateModels[ctrl.$type]
    ctrl.call(update)


}


function openComposition() {
    this.composing = true
}

function closeComposition() {
    this.composing = false
}

function openCaret() {
    this.caret = true
}

function closeCaret() {
    this.caret = false
}

markID(openComposition)
markID(closeComposition)
markID(openCaret)
markID(closeCaret)