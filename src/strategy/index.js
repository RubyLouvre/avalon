
avalon.lexer = require('./lexer')
avalon.diff = require('./diff')
avalon.batch = require('./batch')
// dispatch与patch 为内置模块

var parseView = require('./parser/parseView')

function render(vtree, num, scan) {
    var num = num || String(new Date - 0).slice(0, 6)
    var body = parseView(vtree, num, scan) + '\n\nreturn vnodes' + num
    var fn = Function('__vmodel__','__fast__', body)
    return fn
}
avalon.render = render

module.exports = avalon
