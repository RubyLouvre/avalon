
avalon.lexer = require('./hydrateByText')
avalon.diff = require('./diff')
avalon.batch = require('./batch')
avalon.scan = require('./scan')
avalon.speedUp = avalon.variant = require('./variantCommon')
avalon.parseExpr = require('./parseExpr')

var serializeChildren = require('./serializeChildren')
var rquoteEscapes = /\\\\(['"])/g
function makeRender(vtree, local) {
    var _body = Array.isArray(vtree) ? 'return ' + serializeChildren(vtree) : vtree
    var _local = []
    if (local) {
        for (var i in local) {
            _local.push('var ' + i + ' = __local__[' + avalon.quote(i) + ']')
        }
    }
    //处理 props: {"ms-effect": "{is:\\'star\\',action:@action}" 的情况 
    _body = _body.replace(rquoteEscapes, "$1")
    var body = '__local__ = __local__ || {};\n' +
            _local.join(';\n') + '\n' + _body

    try {
        var fn = Function('__vmodel__', '__local__', body)
    } catch (e) {
        avalon.warn(_body, e, 'render parse error')
    }
    return fn
}

avalon.render = makeRender

avalon.matchDep = function (a, s) {
    if (!s || !a)
        return true
    return  s.test(a)///a.split(',').some(match, s)
}
function match(path) {
    if (this.indexOf(path) === 0)
        return true
}
//https://www.cnblogs.com/pigtail/p/3342977.html
//http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
avalon.addDirs = function (obj) {
    var args = avalon.slice(arguments, 1)
    var hasDynamic = false
    for (var i = 0; i < args.length; i += 3) {
        var path = args[i]
        var dir = args[i + 1]
        var fn = args[i + 2]
        if ( avalon.matchDep(path, avalon.spath)) {
            obj[dir] = fn()
            hasDynamic = true
        }
    }
    if (hasDynamic) {
        obj.dynamic = {}
    }
    return obj
}
