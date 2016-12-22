import { avalon, createFragment } from '../../seed/core'
import { rcheckedType } from '../../dom/rcheckedType'
import { lookupOption } from './option'
import { fromString } from '../../vtree/fromString'
import { updateModel } from './updateDataHandle'
import { addScope, makeHandle, createSetter } from '../../parser/index'


var rchangeFilter = /\|\s*change\b/
var rdebounceFilter = /\|\s*debounce(?:\(([^)]+)\))?/
export function duplexParse(dir, node) {
    /**
     * dtype: String,
     * isChange: Boolean | Undefined,
     * isChecked: Boolean | Undefined,
     * expr: String,
     * debounceTime: Number,
     * expr: String,
     * parsers: String,
     * name: String,
     * cb: String | Undefined
     */

    //抽取里面的change, debounce过滤器为isChanged， debounceTime
    var expr = dir.expr,
        dtype
    if (rchangeFilter.test(expr)) {
        dir.isChanged = true
        expr = expr.replace(rchangeFilter, '')
    }
    var match = expr.match(rdebounceFilter)
    if (match) {
        expr = expr.replace(rdebounceFilter, '')
        if (!dir.isChanged) {
            dir.debounceTime = parseInt(match[1], 10) || 300
        }
    }
    dir.expr = expr

    //处理数据转换器
    var etype = node.props.type
    var parsers = dir.param || ''
    delete dir.param
    var isChecked = /checked/.test(parsers)

    // node.duplex = this
    if (rcheckedType.test(etype) && isChecked) {
        //如果是radio, checkbox,并使用了ms-duplex-checked，那么禁用其他parsers
        parsers = ''
        dtype = 'radio'
        dir.isChecked = isChecked
    }
    dir.parsers = parsers

    //处理dtype

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
    dir.dtype = dtype

    //判定是否使用了 change debounce 过滤器
    // 如果不是dtype不是input,contenteditable，那不能使用isChange, debounceTime
    if (dtype !== 'input' && dtype !== 'contenteditable') {
        delete dir.isChange
        delete dir.debounceTime
    }
    //处理回调
    var cbName = 'data-duplex-changed'
    var cb = node.props[cbName]
    if (node.dom) {
        node.dom.removeAttribute(cbName)
    }
    dir.cb = cb
}

export function duplexDiff(oldVal, newVal) {
    if (Array.isArray(newVal)) {
        if (newVal + '' !== this.compareVal) {
            this.compareVal = newVal + ''
            return true
        }
    } else {
        this.parseValue = parseValue
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
export function duplexInit(vdom, addEvent) {
    var dom = vdom.dom
    this.vdom = vdom
    this.dom = dom

    //添加userCb
    if (this.cb) {
        var arr = addScope(this.cb, 'xx')
        var body = makeHandle(arr[0])
        this.userCb = new Function('$event', 'var __vmodel__ = this\nreturn ' + body)
    }
    var setter = createSetter(this.expr, 'duplex')
    this.setValue = function(value){
        setter(vdom.vm, value)
    }
    //添加duplexCb
    this.duplexCb = updateModel

    dom._ms_duplex_ = this
        //绑定事件
    addEvent(dom, this)
        //添加验证
    duplexValidate(dom, vdom)
}

export function duplexValidate(dom, vdom) {
    //将当前虚拟DOM的duplex添加到它上面的表单元素的validate指令的fields数组中
    var field = vdom.duplex
    var rules = vdom.rules

    if (rules && !field.validator) {
        while (dom && dom.nodeType === 1) {
            var validator = dom._ms_validate_
            if (validator) {
                field.rules = rules
                field.validator = validator

                if (avalon.Array.ensure(validator.fields, field)) {
                    validator.addField(field)
                }
                break
            }
            dom = dom.parentNode
        }
    }
}


export var valueHijack = true
try { //#272 IE9-IE11, firefox
    var setters = {}
    var aproto = HTMLInputElement.prototype
    var bproto = HTMLTextAreaElement.prototype
    var newSetter = function(value) { // jshint ignore:line
        setters[this.tagName].call(this, value)
        var data = this._ms_duplex_
        if (!this.caret && data && data.dtype === 'input') {
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
    if (!this.parsers)
        return val
    this.parsers.replace(/\w+/g, function(k) {
        var fn = avalon.parsers[k]
        if (fn) {
            val = fn.call(this, val)
        }
    })
    return val
}

export var updateView = {
    input: function() { //处理单个value值处理
        this.vdom.props.value = this.value + ''
        this.dom.value = this.value

    },
    updateChecked: function(vdom, checked) {
        if (vdom.dom) {
            vdom.dom.defaultChecked = vdom.dom.checked = checked
        }
    },
    radio: function() { //处理单个checked属性
        var node = this.vdom
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
    checkbox: function() { //处理多个checked属性
        var node = this.vdom
        var props = node.props
        var value = props.value + ''
        var values = [].concat(this.value)
        var checked = values.some(function(el) {
            return el + '' === value
        })

        props.defaultChecked = props.checked = checked
        updateView.updateChecked(node, checked)
    },
    select: function() { //处理子级的selected属性
        var a = Array.isArray(this.value) ?
            this.value.map(String) : this.value + ''
        lookupOption(this.vdom, a)
    },
    contenteditable: function() { //处理单个innerHTML 

        var vnodes = fromString(this.value)
        var fragment = createFragment()
        for (var i = 0, el; el = vnodes[i++];) {
            var child = avalon.vdom(el, 'toDOM')
            fragment.appendChild(child)
        }
        avalon.clearHTML(this.dom).appendChild(fragment)
        var list = this.vdom.children
        list.length = 0
        Array.prototype.push.apply(list, vnodes)

        this.duplexCb.call(this.dom)
    }
}