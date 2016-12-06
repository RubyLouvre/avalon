import { avalon, createFragment } from '../../seed/core'
import { rcheckedType } from '../../dom/rcheckedType'
import { lookupOption } from './option'
import { addScope, makeHandle } from '../../parser/index'
import { fromString } from '../../vtree/fromString'


var rchangeFilter = /\|\s*change\b/
var rdebounceFilter = /\|\s*debounce(?:\(([^)]+)\))?/
export function duplexBeforeInit() {
    var expr = this.expr
    if (rchangeFilter.test(expr)) {
        this.isChanged = true
        expr = expr.replace(rchangeFilter, '')
    }
    var match = expr.match(rdebounceFilter)
    if (match) {
        expr = expr.replace(rdebounceFilter, '')
        if (!this.isChanged) {
            this.debounceTime = parseInt(match[1], 10) || 300
        }
    }
    this.expr = expr
}
export function duplexInit() {
    var expr = this.expr
    var node = this.node
    var etype = node.props.type
    this.parseValue = parseValue
    //处理数据转换器
    var parsers = this.param, dtype
    var isChecked = false
    parsers = parsers ? parsers.split('-').map(function (a) {
        if (a === 'checked') {
            isChecked = true
        }
        return a
    }) : []
    node.duplex = this
    if (rcheckedType.test(etype) && isChecked) {
        //如果是radio, checkbox,判定用户使用了checked格式函数没有
        parsers = []
        dtype = 'radio'
        this.isChecked = isChecked
    }
    this.parsers = parsers
    if (!/input|textarea|select/.test(node.nodeName)) {
        if ('contenteditable' in node.props) {
            dtype = 'contenteditable'
        }
    } else if (!dtype) {
        dtype = node.nodeName === 'select' ? 'select' :
            etype === 'checkbox' ? 'checkbox' :
                etype === 'radio' ? 'radio' :
                    'input'
    }
    this.dtype = dtype
    var isChanged = false, debounceTime = 0
    //判定是否使用了 change debounce 过滤器
    // this.isChecked = /boolean/.test(parsers)
    if (dtype !== 'input' && dtype !== 'contenteditable') {
        delete this.isChange
        delete this.debounceTime
    } else if (!this.isChecked) {
        this.isString = true
    }

    var cb = node.props['data-duplex-changed']
    if (cb) {
        var arr = addScope(cb, 'xx')
        var body = makeHandle(arr[0])
        this.userCb = new Function('$event', 'var __vmodel__ = this\nreturn ' + body)
    }

}
export function duplexDiff(newVal, oldVal) {
    if (Array.isArray(newVal)) {
        if (newVal + '' !== this.compareVal) {
            this.compareVal = newVal + ''
            return true
        }
    } else {
        newVal = this.parseValue(newVal)
        if (!this.isChecked) {
            this.value = newVal += ''
        }
        if (newVal !== this.compareVal) {
            this.compareVal = newVal
            return true
        }
    }

}


export function duplexValidate(node, vdom) {
    //将当前虚拟DOM的duplex添加到它上面的表单元素的validate指令的fields数组中
    var field = vdom.duplex
    var rules = vdom.rules

    if (rules && !field.validator) {
        while (node && node.nodeType === 1) {
            var validator = node._ms_validate_
            if (validator) {
                field.rules = rules
                field.validator = validator

                if (avalon.Array.ensure(validator.fields, field)) {
                    validator.addField(field)
                }
                break
            }
            node = node.parentNode
        }
    }
}


export var valueHijack = true
try { //#272 IE9-IE11, firefox
    var setters = {}
    var aproto = HTMLInputElement.prototype
    var bproto = HTMLTextAreaElement.prototype
    var newSetter = function (value) { // jshint ignore:line
        setters[this.tagName].call(this, value)
        var data = this._ms_duplex_
        if (!this.caret && data && data.isString) {
            data.duplexCb.call(this, { type: 'setter' })
        }
    }
    var inputProto = HTMLInputElement.prototype
    Object.getOwnPropertyNames(inputProto) //故意引发IE6-8等浏览器报错
    setters['INPUT'] = Object.getOwnPropertyDescriptor(aproto, 'value').set

    Object.defineProperty(aproto, 'value', {
        set: newSetter
    })
    setters['TEXTAREA'] = Object.getOwnPropertyDescriptor(bproto, 'value').set
    Object.defineProperty(bproto, 'value', {
        set: newSetter
    })
    valueHijack = false
} catch (e) {
    //在chrome 43中 ms-duplex终于不需要使用定时器实现双向绑定了
    // http://updates.html5rocks.com/2015/04/DOM-attributes-now-on-the-prototype
    // https://docs.google.com/document/d/1jwA8mtClwxI-QJuHT7872Z0pxpZz8PBkf2bGAbsUtqs/edit?pli=1
}

function parseValue(val) {
    for (var i = 0, k; k = this.parsers[i++];) {
        var fn = avalon.parsers[k]
        if (fn) {
            val = fn.call(this, val)
        }
    }
    return val
}

export var updateView = {
    input: function () {//处理单个value值处理
        this.node.props.value = this.value + ''
        this.dom.value = this.value

    },
    updateChecked: function (vdom, checked) {
        if (vdom.dom) {
           vdom.dom.defaultChecked =  vdom.dom.checked = checked
        }
    },
    radio: function () {//处理单个checked属性
        var node = this.node
        var nodeValue = node.props.value
        var checked
        if (this.isChecked) {
            checked = !!this.value
        } else {
            checked = this.value + '' === nodeValue
        }
        node.props.checked = checked
        updateView.updateChecked(node, checked)
    },
    checkbox: function () {//处理多个checked属性
        var node = this.node
        var props = node.props
        var value = props.value+''
        var values = [].concat(this.value)
        var checked = values.some(function (el) {
            return el + ''=== value
        })
        
        props.defaultChecked = props.checked = checked
        updateView.updateChecked(node, checked)
    },
    select: function () {//处理子级的selected属性
        var a = Array.isArray(this.value) ?
            this.value.map(String) : this.value + ''
        lookupOption(this.node, a)
    },
    contenteditable: function () {//处理单个innerHTML 

        var vnodes = fromString(this.value)
        var fragment = createFragment()
        for (var i = 0, el; el = vnodes[i++];) {
            var child = avalon.vdom(el, 'toDOM')
            fragment.appendChild(child)
        }
        avalon.clearHTML(this.dom).appendChild(fragment)
        var list = this.node.children
        list.length = 0
        Array.prototype.push.apply(list, vnodes)

        this.duplexCb.call(this.dom)
    }
}

