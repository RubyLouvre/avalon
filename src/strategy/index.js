
avalon.lexer = require('./text2vdom')
avalon.diff = require('./diff')
avalon.batch = require('./batch')
avalon.speedUp = require('./variantCommon')
avalon.parseExpr = require('./parseExpr')

// dispatch与patch 为内置模块
var vdom2body = require('./vdom2body')
var rquoteEscapes = /\\\\(['"])/g
function render(vtree, local) {
    var _body = Array.isArray(vtree) ? vdom2body(vtree) : vtree
    var _local = []
    if (local) {
        for (var i in local) {
            _local.push('var ' + i + ' = __local__['+avalon.quote(i)+']')
        }
    }
    //处理 props: {"ms-effect": "{is:\\'star\\',action:@action}" 的情况 
    _body = _body.replace(rquoteEscapes,"$1")
    var body = '__local__ = __local__ || {};\n' +
            _local.join(';\n')+'\n' + _body
    
    try{
    var fn = Function('__vmodel__', '__local__', body)
    }catch(e){
        avalon.warn(_body, 'render parse error')
    }
    return fn
}

avalon.render = render

module.exports = avalon
