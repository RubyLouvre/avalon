
avalon.lexer = require('./hydrateByText')
avalon.diff = require('./diff')
avalon.batch = require('./batch')
avalon.scan = require('./scan')
avalon.speedUp = avalon.variant = require('./variantCommon')
avalon.parseExpr = require('./parseExpr')

// dispatch与patch 为内置模块
var serializeChildren = require('./serializeChildren')
var rquoteEscapes = /\\\\(['"])/g
function render(vtree, local) {
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
        avalon.warn(e)
        avalon.warn(_body, 'render parse error')
    }
    return fn
}

avalon.render = render


avalon.matchDep = function (a, s) {
    if (!s)
        return true
    return a.split(',').some(match, s)
}
function match(path) {
    if (this.indexOf(path) === 0)
        return true
}

avalon.addDirs = function (obj) {
    var args = avalon.slice(arguments, 1)
    var hasDynamic = false
    for (var i = 0; i < args.length; i += 3) {
        var path = args[i]
        var dir = args[i + 1]
        var fn = args[i + 2]
        if (avalon.matchDep(path, avalon.spath)) {
            if (dir.indexOf('ms-on') === -1) {
                obj[dir] = fn()
            } else {
                obj[dir] = fn
            }
            hasDynamic = true
        }
    }
    if (hasDynamic) {
        obj.dynamic = {}
    }
    return obj
}
