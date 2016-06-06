
var update = require('../_update')
var evaluatorPool = require('../../strategy/parser/evaluatorPool')
var stringify = require('../../strategy/parser/stringify')

var rchangeFilter = /\|\s*change\b/
var rcheckedType = /^(?:checkbox|radio)$/
var rdebounceFilter = /\|\s*debounce(?:\(([^)]+)\))?/
var genVirtualSelectChildren = require('./genVirtualSelectChildren')
var updateModelByEvent = require('./updateModelByEvent.modern')
var updateModelByValue = require('./updateModelByValue')
var updateModel = require('./updateModelHandle')
var updateView = require('./updateView.modern')
var addValidateField = require('./addValidateField')


avalon.directive('duplex', {
    priority: 2000,
    parse: function (cur, pre, binding) {
        var expr = binding.expr
        var etype = pre.props.type
        //处理数据转换器
        var parser = binding.param, dtype
        var isChecked = false
         parser = parser ?
            '[' + parser.split('-').map(function(a){
                if(a === 'checked'){
                    isChecked = true
                }
                return avalon.quote(a)
            }) + ']': '[]'
       
        if (rcheckedType.test(etype) && isChecked) {
            //如果是radio, checkbox,判定用户使用了checked格式函数没有
            parser = '[]'
            dtype = 'radio'
        }

        if (!/input|textarea|select/.test(pre.type)) {
            if ('contenteditable' in pre.props) {
                dtype = 'contenteditable'
            }
        } else if (!dtype) {
            dtype = pre.type === 'select' ? 'select' :
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

        cur.vmodel = '__vmodel__'
        cur.modelValue = '('+avalon.parseExpr(binding, 'duplex')+')(__vmodel__)'// 输出原始数据
        cur.duplexSetter = evaluatorPool.get('duplex:set:' + expr)
        var format = evaluatorPool.get('duplex:format:' + expr)
        var changed = cur.props['data-duplex-changed']
        cur.callback = changed ? avalon.parseExpr(changed,'on'):'avalon.noop'
        cur.duplexFormat = format || 'function(vm, a){return a}'
        cur.duplexData = stringify({
            type: dtype, //这个决定绑定什么事件
            isChecked: isChecked,
            isChanged: isChanged, //这个决定同步的频数
            parser: parser, //用于转换原始的视图数据
            callback: changed ? avalon.parseExpr(binding, 'on') : 'avalon.noop',
            debounceTime: debounceTime, //这个决定同步的频数
            vmodel: '__vmodel__'
        })

    },
    diff: function (cur, pre, steps) {
        var curValue = cur.modelValue
        var preValue = pre.modelValue
        var viewValue = cur.duplexFormat(cur.vmodel, curValue)
        
        if (String(viewValue) !==
                String(cur.duplexFormat(cur.vmodel, preValue))) {
            cur.viewValue = viewValue
            
            if (cur.type === 'select' && !cur.children.length) {
                avalon.Array.merge(cur.children, avalon.lexer(cur.template, 0, 2))
                genVirtualSelectChildren(cur, viewValue)
            }
            update(cur, this.update, steps, 'duplex', 'afterChange')
        }
    },
    update: function (node, vnode) {

        if (node && node.nodeType === 1) {
            if (!node.getAttribute('duplex-inited')) {
                node.__ms_duplex__ = vnode.duplexData
                node.setAttribute('duplex-inited', 'true')
                updateModelByEvent(node, vnode)
            }
            var data = node.__ms_duplex__
            data.format = vnode.duplexFormat
            data.set = vnode.duplexSetter
            data.parse = parseValue
            data.callback = vnode.callback
            addValidateField(node, vnode)
            if (!avalon.msie && updateModelByValue === false && !node.valueHijack) {
                //chrome 42及以下版本需要这个hack
             
                node.valueHijack = updateModel
                var intervalID = setInterval(function () {
                    if (!avalon.contains(avalon.root, node)) {
                        clearInterval(intervalID)
                    } else {
                        node.valueHijack()
                    }
                }, 30)
            }
         
 
            if (data.viewValue !== vnode.viewValue) {
                data.modelValue = vnode.modelValue //原始数据
                if(!Array.isArray(vnode.modelValue)){
                    var parsedValue = data.parse( vnode.viewValue)
                    if(parsedValue !== data.modelValue){
                        data.set(data.vmodel, parsedValue)
                    }
                }
                
                                
                data.viewValue = vnode.viewValue  //被过滤器处理的数据
                data.element = node
                updateView[data.type].call(data)
                if (node.caret) {
                    var pos = data.caretPos
                    pos && data.setCaret(node, pos.start, pos.end)
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