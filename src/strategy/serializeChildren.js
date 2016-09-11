module.exports = serializeChildren

function serializeChildren(children, skip, aa) {
    var lexeme = children.map(function (a) {
        var stem = serializeNode(a, skip)
        var prefix = a.$append
        var suffix = a.$prepend
        delete a.$append
        delete a.prepend
        return {
            stem: stem,
            prefix: prefix,
            suffix: suffix
        }
    })
    var needWrapper = lexeme.some(hasFix)
    if (needWrapper) {
        var buffer = bufferChildren(lexeme)
        buffer.unshift('(function(){', 'var nodes = []')
        buffer.push('return nodes', '})()')
        return buffer.join('\n')
    } else {
        return  '[' + lexeme.filter(function (node) {
            return node.stem
        }).join('\n') + ']'
    }
}

function bufferChildren(nodes) {
//ms-important， ms-controller ， ms-for 不可复制，省得死循环
//ms-important --> ms-controller --> ms-for --> ms-widget --> ms-effect --> ms-if
    var buffer = []
    for (var i = 0, node; node = nodes[i++]; ) {
        if (node.prefix) {
            buffer.push(node.prefix)
        }
        if (node.stem) {
            buffer.push('vnodes.push(' + node.stem + ')')
        }
        if (node.suffix) {
            buffer.push(node.suffix)
        }
    }
    return buffer
}

function serializeNode(node, skip) {
    switch (node.nodeName) {
        case void(0):
            return ''
        case '#text':
            return serializeText(node, skip)
        case '#comment':
            if (node.forExpr) {// 处理ms-for指令
                return serializeForStart(node, skip)
            } else if (!skip && node.nodeValue === 'ms-for-end:') {
                return serializeForEnd(node, skip)
            } else if (!skip && node.nodeValue.indexOf('ms-if:') === 0) {
                return serializeLogic(node, skip)
            } else {
                return jsonfy(node)
            }
        default:
            return serializeElement(node, skip)
    }
}


var skips = {__local__: 1, vmode: 1, dom: 1}

function serializeElement(vdom, skip) {
    var props = vdom.props
    var copy = {
        nodeName: vdom.nodeName
    }
    var dirs = []
    if (props && !skip) {
        skip = 'ms-skip' in props
        var bindings = skip ? [] : extractBindings(copy, props)
        bindings.forEach(function (b) {
            //将ms-*的值变成函数,并赋给copy.props[ms-*]
            //如果涉及到修改结构,则在vdom添加$append,$prepend
            avalon.directives[b.type].parse(copy, vdom, b)
            var name = b.name
            if (typeof copy[name] === 'string') {
                dirs.push(b.paths, name, copy[name])
                delete copy[name]
            } else {
                copy.dynamic = '{}'
            }
        })
    }
    if (vdom.isVoidTag) {
        copy.isVoidTag = true
    } else {
        if (!('children' in copy)) {
            var children = vdom.children
            if (Array.isArray(children)) {
                copy.children = serializeChildren(children, skip || !!vdom.skipContent)
            }
        }
    }
    if (vdom.template)
        copy.template = vdom.template
    if (vdom.skipContent)
        copy.skipContent = true
    return jsonfy(copy, dirs)
}

//判定目标对象是否拥有prefix, suffix
function hasFix(a) {
    return a.prefix || a.suffix
}

function serializeText(vdom, skip) {
    if (!skip && avalon.config.rexpr.test(vdom.nodeValue)) {
        var binding = {
            expr: vdom.nodeValue,
            type: 'text'
        }
        var a = avalon.parseText(binding)
        var dirs = [binding.paths, 'nodeValue', a]
        return jsonify(vdom, dirs)
    } else {
        return jsonify(vdom)
    }
}

function serializeForStart(vdom) {
    var copy = {
        vmodel: '__vmodel__'
    }
    for (var i in vdom) {
        if (vdom.hasOwnProperty(i) && !skips[i]) {
            copy[i] = vdom[i]
        }
    }
    avalon.directives['for'].parse(copy, vdom, {})
    //为copy添加dynamic
    vdom.$append += avalon.caches[vdom.signature] //vdom.template
    return jsonify(copy)
}

function serializeForEnd(vdom) {
    vdom.$append = addTag({
        nodeName: '#comment',
        nodeValue: vdom.signature

    }) +
            ' return vnodes}\n })\n},__local__, vnodes)\n' +
            addTag({
                nodeName: "#comment",
                signature: vdom.signature,
                nodeValue: "ms-for-end:"
            }) + '\n'
    return ''
}

var rstatement = /^\s*var\s+([$\w]+)\s*\=\s*\S+/

function serializeLogic(vdom) {
    var nodeValue = vdom.nodeValue
    var statement = parseExpr(nodeValue.replace('ms-js:', ''), 'js')
    var match = statement.text.match(rstatement)
    if (match && match[1]) {
        vdom.$append = (vdom.$append || '') + statement.text +
                "\n__local__." + match[1] + ' = ' + match[1] + '\n'
    } else {
        avalon.warn(nodeValue + ' parse fail!')
    }
    return jsonfy(vdom)
}




avalon.matchDep = function (a, s) {
    if (!s)
        return true
    return a.split(',').some(function (aa) {
        if (s.indexOf(aa) === 0)
            return true
    })
}

avalon.addDirs = function (obj) {
    var args = avalon.slice(arguments, 1)
    var hasDynamic = false
    for (var i = 0; i < args.length; i += 3) {
        var path = args[i]
        var dir = args[i + 1]
        var fn = args[i + 2]
        if (avalon.matchDep(path, avalon.spath)) {
            if (typeof fn === 'function' && dir.indexOf('ms-on') === -1) {
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

var directives = avalon.directives
var rbinding = /^(\:|ms\-)\w+/
var eventMap = avalon.oneObject('animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit')

function extractBindings(cur, props) {
    var bindings = []
    var attrs = {}
    var skip = 'ms-skip' in props//old
    var uniq = {}
    for (var i in props) {
        var value = props[i], match
        attrs[i] = props[i]
        if ((match = i.match(rbinding))) {
            /* istanbul ignore if  */
            if (skip)
                continue

            var arr = i.replace(match[1], '').split('-')

            if (eventMap[arr[0]]) {
                arr.unshift('on')
            }
            if (arr[0] === 'on') {
                arr[2] = parseFloat(arr[2]) || 0
            }
            arr.unshift('ms')
            var type = arr[1]
            if (directives[type]) {
                var binding = {
                    type: type,
                    param: arr[2],
                    name: arr.join('-'),
                    expr: value,
                    priority: directives[type].priority || type.charCodeAt(0) * 100
                }

                if (type === 'on') {
                    binding.priority += arr[3]
                }
                if (!uniq[binding.name]) {
                    uniq[binding.name] = value
                    bindings.push(binding)
                }
            }
        }
    }

    cur.props = attrs

    bindings.sort(byPriority)

    return bindings
}

function byPriority(a, b) {
    return a.priority - b.priority
}