
avalon.lexer = require('./lexer')
avalon.diff = require('./diff')
avalon.batch = require('./batch')
// dispatch与patch 为内置模块
var parseView = require('./parser/parseView')

function render(vtree) {
    var _body = Array.isArray(vtree) ? parseView(vtree) : vtree
    var body = '__local__ = __local__ || {};\n'+
               'var __present__, __top__,__synth__;\n'+ _body
    var fn = Function('__vmodel__','__local__' ,body)
    return fn
}
avalon.render = render

module.exports = avalon
