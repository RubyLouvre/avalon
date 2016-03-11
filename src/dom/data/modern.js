
var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/
avalon.parseJSON = JSON.parse

function parseData(data) {
    try {
        if (typeof data === 'object')
            return data
        data = data === 'true' ? true :
                data === 'false' ? false :
                data === 'null' ? null : +data + '' === data ? +data : rbrace.test(data) ? JSON.parse(data) : data
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


if (avalon.root.dataset) {
    avalon.fn.data = function (name, val) {
        name = name && avalon.camelize(name)
        var dataset = this[0].dataset
        switch (arguments.length) {
            case 2:
                dataset[name] = val
                return this
            case 1:
                val = dataset[name]
                return parseData(val)
            case 0:
                var ret = {}
                for (name in dataset) {
                    ret[name] = parseData(dataset[name])
                }
                return ret
        }
    }
}