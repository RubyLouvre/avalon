
var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
        rvalidchars = /^[\],:{}\s]*$/,
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

function parseData(data) {
    try {
        if (typeof data === 'object')
            return data
        data = data === 'true' ? true :
                data === 'false' ? false :
                data === 'null' ? null : +data + '' === data ? +data :
                rbrace.test(data) ? avalon.parseJSON(data) : data
    } catch (e) {
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

avalon.fn.data = function (name, value) {
    name = 'data-' + avalon.hyphen(name || '')
    switch (arguments.length) {
        case 2:
            this.attr(name, value)
            return this
        case 1:
            var val = this.attr(name)
            return parseData(val)
        case 0:
            var ret = {}
            avalon.each(this[0].attributes, function (i, attr) {
                if (attr) {
                    name = attr.name
                    if (!name.indexOf('data-')) {
                        name = avalon.camelize(name.slice(5))
                        ret[name] = parseData(attr.value)
                    }
                }
            })
            return ret
    }
}

