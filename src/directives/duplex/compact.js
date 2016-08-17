
var update = require('../_update')
var evaluatorPool = require('../../strategy/parser/evaluatorPool')
var stringify = require('../../strategy/parser/stringify')

var rchangeFilter = /\|\s*change\b/
var rcheckedType = /^(?:checkbox|radio)$/
var rdebounceFilter = /\|\s*debounce(?:\(([^)]+)\))?/
var updateModelByEvent = require('./updateModelByEvent.compact')
var updateModelByValue = require('./updateModelByValue')
var updateModel = require('./updateModelHandle')
var updateView = require('./updateView.compact')
var addValidateField = require('./addValidateField')
var duplexDir = 'ms-duplex'


avalon.directive('duplex', {
    priority: 2000,
    parse: function (copy, src, binding) {
        var expr = binding.expr
        var etype = src.props.type
        //处理数据转换器
        var parsers = binding.param, dtype
        var isChecked = false
        parsers = parsers ? parsers.split('-').map(function (a) {
            if (a === 'checked') {
                isChecked = true
            }
            return a
        }) : []

        if (rcheckedType.test(etype) && isChecked) {
            //如果是radio, checkbox,判定用户使用了checked格式函数没有
            parsers = []
            dtype = 'radio'
        }

        if (!/input|textarea|select/.test(src.nodeName)) {
            if ('contenteditable' in src.props) {
                dtype = 'contenteditable'
            }
        } else if (!dtype) {
            dtype = src.nodeName === 'select' ? 'select' :
                    etype === 'checkbox' ? 'checkbox' :
                    etype === 'radio' ? 'radio' :
                    'input'
        }
        var isChanged = false, debounceTime = 0
        //判定是否使用了 change debounce 过滤器
        if (dtype === 'input' || dtype === 'contenteditable') {
            var isString = true
            if (rchangeFilter.test(expr)) {
                isChanged = true
            }
            if (!isChanged) {
                var match = expr.match(rdebounceFilter)
                if (match) {
                    debounceTime = parseInt(match[1], 10) || 300
                }
            }
        }


        var changed = copy.props['data-duplex-changed']
        var get = avalon.parseExpr(binding, 'duplex')// 输出原始数据
        var quoted = parsers.map(function (a) {
            return avalon.quote(a)
        })
        copy[duplexDir] = stringify({
            type: dtype, //这个决定绑定什么事件
            vmodel: '__vmodel__',
            local: '__local__',
            debug: avalon.quote(binding.name + '=' + binding.expr),
            isChecked: isChecked,
            parsers: '[' + quoted + ']',
            isString: !!isString,
            isChanged: isChanged, //这个决定同步的频数
            debounceTime: debounceTime, //这个决定同步的频数
            get: get, //经过所有
            set: evaluatorPool.get('duplex:set:' + expr),
            callback: changed ? avalon.parseExpr(changed, 'on') : 'avalon.noop'
        })

    },
    diff: function (copy, src) {
        if (!src.dynamic[duplexDir]) {
            //第一次为原始虚拟DOM添加duplexData
            var data = src[duplexDir] = copy[duplexDir]
            data.parse = parseValue
        } else {
            data = src[duplexDir]
        }
        if (copy !== src) {//释放内存
            copy[duplexDir] = null
        }

        var curValue = data.get(data.vmodel)
        var preValue = data.value
        if (data.isString) {//减少不必要的视图渲染
            curValue = data.parse(curValue)
            curValue += ''
            if (curValue === preValue) {
                return
            }
        } else if (Array.isArray(curValue)) {
            var hack = true
            if (curValue + '' === data.arrayHack) {
                return
            }
        }
        data.value = curValue
        //如果是curValue是一个数组,当我们改变vm中的数组,
        //那么这个data.value也是跟着改变,因此必须保持一份副本才能用于比较 
        if (hack) {
            data.arayHack = curValue + ''
        }
        update(src, this.update, 'afterChange')
    },
    update: function (dom, vdom) {
        if (dom && dom.nodeType === 1) {
            //vdom.dynamic变成字符串{}
            vdom.dynamic[duplexDir] = 1
            if (!dom.__ms_duplex__) {
                dom.__ms_duplex__ = vdom[duplexDir]
                //绑定事件
                updateModelByEvent(dom, vdom)
                //添加验证
                addValidateField(dom, vdom)
            }

            var data = dom.__ms_duplex__
            data.dom = dom
            //如果不支持input.value的Object.defineProperty的属性支持,
            //需要通过轮询同步, chrome 42及以下版本需要这个hack
            if (data.isString
                    && !avalon.msie
                    && updateModelByValue === false
                    && !dom.valueHijack) {

                dom.valueHijack = updateModel
                var intervalID = setInterval(function () {
                    if (!avalon.contains(avalon.root, dom)) {
                        clearInterval(intervalID)
                    } else {
                        dom.valueHijack({type: 'poll'})
                    }
                }, 30)
            }
            //更新视图
            updateView[data.type].call(data)
        }
    }
})

function parseValue(val) {
    for (var i = 0, k; k = this.parsers[i++]; ) {
        var fn = avalon.parsers[k]
        if (fn) {
            val = fn.call(this, val)
        }
    }
    return val
}

