/**
 * ------------------------------------------------------------
 * render 根据某一视图生成一个模板函数
 * ------------------------------------------------------------
 */


var parseView = require('./parser/parseView')

function render(vtree) {
    var num = num || String(new Date - 0).slice(0, 6)
    var body = parseView(vtree, num) + '\n\nreturn nodes' + num
    var fn = Function('__vmodel__', body)
    return fn
}

module.exports = avalon.render = render

