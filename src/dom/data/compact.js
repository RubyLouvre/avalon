
var rvalidchars = /^[\],:{}\s]*$/,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g

avalon.parseJSON = avalon.window.JSON ? JSON.parse : function (data) {
    if (typeof data === 'string') {
        data = data.trim();
        if (data) {
            if (rvalidchars.test(data.replace(rvalidescape, '@')
                    .replace(rvalidtokens, ']')
                    .replace(rvalidbraces, ''))) {
                return (new Function('return ' + data))() // jshint ignore:line
            }
        }
        avalon.error('Invalid JSON: ' + data)
    }
    return data
}


avalon.fn.attr = function (name, value) {
    if (arguments.length === 2) {
        this[0].setAttribute(name, value)
        return this
    } else {
        return this[0].getAttribute(name)
    }
}

