



function parser(view) {
    var num = num || String(new Date - 0).slice(0, 6)
    var body = parseView(view, num) + '\n\nreturn nodes' + num
    var fn = Function('__vmodel__', body)
    return fn
}