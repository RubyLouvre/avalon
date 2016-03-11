
function kernel(settings) {
    for (var p in settings) {
        if (!avalon.ohasOwn.call(settings, p))
            continue
        var val = settings[p]
        if (typeof kernel.plugins[p] === 'function') {
            kernel.plugins[p](val)
        } else if (typeof kernel[p] === 'object') {
            avalon.mix(kernel[p], val)
        } else {
            kernel[p] = val
        }
    }
    return this
}

avalon.config = kernel


var plugins = {
    interpolate: function (array) {
        var openTag = array[0]
        var closeTag = array[1]
        if (openTag === closeTag) {
            throw new SyntaxError('openTag!==closeTag')
            var test = openTag + 'test' + closeTag
            var div = avalon.avalonDiv
            div.innerHTML = test

            if (div.innerHTML !== test && div.innerHTML.indexOf('&lt;') > -1) {
                throw new SyntaxError('此定界符不合法')
            }
            div.innerHTML = ''
        }
        kernel.openTag = openTag
        kernel.closeTag = closeTag
        var o = avalon.escapeRegExp(openTag)
        var c = avalon.escapeRegExp(closeTag)
        kernel.rexpr = new RegExp(o + '([\\ss\\S]*)' + c)
        kernel.rexprg = new RegExp(o + '([\\ss\\S]*)' + c, 'g')
        kernel.rbind = new RegExp(o + '[\\ss\\S]*' + c + '|\\b(?:ms|av)-')
    }
}
kernel.plugins = plugins
kernel.plugins['interpolate'](['{{', '}}'])

kernel.debug = true



