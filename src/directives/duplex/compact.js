
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


avalon.directive('duplex', {
    priority: 2000,
    parse: function (copy, src, binding) {
        var expr = binding.expr
        var etype = src.props.type
        //处理数据转换器
        var parser = binding.param, dtype
        var isChecked = false
        parser = parser ?  parser.split('-').map(function(a){
                if(a === 'checked'){
                    isChecked = true
                }
                return a
            }) : []
       
        if (rcheckedType.test(etype) && isChecked) {
            //如果是radio, checkbox,判定用户使用了checked格式函数没有
            parser = []
            dtype = 'radio'
        }

        if (!/input|textarea|select/.test(src.type)) {
            if ('contenteditable' in src.props) {
                dtype = 'contenteditable'
            }
        } else if (!dtype) {
            dtype = src.type === 'select' ? 'select' :
                    etype === 'checkbox' ? 'checkbox' :
                    etype === 'radio' ? 'radio' :
                    'input'
        }
        var isChanged = false, debounceTime = 0
        //判定是否使用了 change debounce 过滤器
        if (dtype === 'input' || dtype === 'contenteditable') {
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

        copy.vmodel = '__vmodel__'
        copy.modelValue = '('+avalon.parseExpr(binding, 'duplex')+')(__vmodel__)'// 输出原始数据
       
        var changed = copy.props['data-duplex-changed']
        copy.callback = changed ? avalon.parseExpr(changed,'on'):'avalon.noop'
        copy.duplexSet = evaluatorPool.get('duplex:set:' + expr)
        var format = evaluatorPool.get('duplex:format:' + expr)
        copy.duplexFormat = format || 'function(vm, a){return a}'
        
        src.duplexData = {
            type: dtype, //这个决定绑定什么事件
            isChecked: isChecked,
            isChanged: isChanged, //这个决定同步的频数
            parser: parser, //用于转换原始的视图数据
            parse: parseValue,
           
            debounceTime: debounceTime //这个决定同步的频数
        }

    },
    diff: function (copy, src) {
        var curValue = copy.modelValue
        var preValue = src.modelValue
        
        
        var data = src.duplexData 
        data.vmodel = copy.vmodel
        data.modelValue = curValue
        data.set = copy.duplexSet
        data.format = copy.duplexFormat
        data.callback = copy.callback
        
        copy.duplexSet = copy.duplexFormat = copy.callback = 0
        
        var viewValue = data.format(copy.vmodel, curValue)
        
        if (String(viewValue) !==
                String(data.format(copy.vmodel, preValue))) {
            src.viewValue =  viewValue
            update(src, this.update, 'afterChange')
        }
    },
    update: function (dom, vdom) {

        if (dom && dom.nodeType === 1) {
            if (!dom.getAttribute('duplex-inited')) {
                dom.__ms_duplex__ = vdom.duplexData
                dom.setAttribute('duplex-inited', 'true')
                updateModelByEvent(dom, vdom)
            }
            var data = dom.__ms_duplex__
      
            data.dom = dom
            addValidateField(dom, vdom)
            if (/input|content/.test(data.type) 
                   && !avalon.msie 
                   && updateModelByValue === false 
                   && !dom.valueHijack) {
                //chrome 42及以下版本需要这个hack
             
                dom.valueHijack = updateModel
                var intervalID = setInterval(function () {
                    if (!avalon.contains(avalon.root, dom)) {
                        clearInterval(intervalID)
                    } else {
                        dom.valueHijack()
                    }
                }, 30)
            }
         
            if (data.viewValue !== vdom.viewValue) {
                if(!Array.isArray(vdom.modelValue)){
                    var parsedValue = data.parse( vdom.viewValue)
                    if(parsedValue !== data.modelValue){
                        data.set(data.vmodel, parsedValue)
                    }
                }
                
                                
                data.viewValue = vdom.viewValue  //被过滤器处理的数据
                updateView[data.type].call(data)
                if (dom.caret) {
                    var pos = data.caretPos
                    pos && data.setCaret(dom, pos.start, pos.end)
                    data.caretPos = null
                }
            }
        }

    }
})

function parseValue( val) {
    for (var i = 0, k; k = this.parser[i++]; ) {
        var fn = avalon.parsers[k]
        if (fn) {
            val = fn.call(this, val)
        }
    }
    return val
}

/*
 vm[ms-duplex]  →  原始modelValue →  格式化后比较   →   输出页面
    ↑                                                ↓
 比较modelValue  ←  parsed后得到modelValue  ← 格式化后比较 ←  原始viewValue
 */