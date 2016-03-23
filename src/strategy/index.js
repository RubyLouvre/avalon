
avalon.lexer = require('./lexer')
avalon.diff = require('./diff')
avalon.batch = require('./batch')
// dispatch与patch 为内置模块

var parseView = require('./parser/parseView')

function render(vtree) {
    var num = num || String(new Date - 0).slice(0, 6)
    var body = parseView(vtree, num) + '\n\nreturn nodes' + num
    var fn = Function('__vmodel__', body)
//    avalon.ready(function(){
//        var a  = document.createElement("pre")
//        a.innerHTML = body
//        document.body.appendChild(a)
//    })
    return fn
}
avalon.render = render

module.exports = avalon
