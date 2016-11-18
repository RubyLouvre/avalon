var rvalidchars = /^[\],:{}\s]*$/,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g

export function compactParseJSON(data) {
    if (typeof data === 'string') {
        data = data.trim()
        if (data) {
            if (rvalidchars.test(data.replace(rvalidescape, '@')
                .replace(rvalidtokens, ']')
                .replace(rvalidbraces, ''))) {
                return (new Function('return ' + data))() // jshint ignore:line
            }
        }
        throw TypeError('Invalid JSON: [' + data + ']')
    }
    return data
}