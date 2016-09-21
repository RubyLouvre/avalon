import avalon from './core'
export default function config(settings) {
    for (var p in settings) {
         /* istanbul ignore if */
        if (!avalon.ohasOwn.call(settings, p))
            continue
        var val = settings[p]
        if (typeof config.plugins[p] === 'function') {
            config.plugins[p](val)
        } else {
            config[p] = val
        }
    }
    return this
}

avalon.config = config

var plugins = {
    interpolate: function (array) {
        var openTag = array[0]
        var closeTag = array[1]
        /*eslint-disable */
         /* istanbul ignore if */
        if (openTag === closeTag) {
            throw new SyntaxError('openTag!==closeTag')
        }
        var test = openTag + 'test' + closeTag
        var div = avalon.avalonDiv
        div.innerHTML = test
         /* istanbul ignore if */
        if (div.innerHTML !== test && div.innerHTML.indexOf('&lt;') > -1) {
            throw new SyntaxError('此定界符不合法')
        }
        div.innerHTML = ''
        /*eslint-enable */
        config.openTag = openTag
        config.closeTag = closeTag
        var o = avalon.escapeRegExp(openTag)
        var c = avalon.escapeRegExp(closeTag)
        config.rexpr = new RegExp(o + '([\\s\\S]*)' + c)
    }
}
config.plugins = plugins
avalon.config({
    interpolate: ['{{', '}}'],
    debug: true
})

