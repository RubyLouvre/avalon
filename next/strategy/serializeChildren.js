/**
 * 
 * 此模块用于将一串虚拟节点变成字符串
 * 
 */
import { avalon, config, directives } from '../seed/lang.share'
import { parseText } from './parseText'
import { extractBindings } from './extractBindings'
import { jsonfy } from './jsonfy'


var skips = { __local__: 1, vmode: 1, dom: 1 }
export function serializeChildren(children, skip) {
    var lexeme = children.map(function (a) {
        var stem = serializeNode(a, skip)
        var suffix = a.suffix
        var prefix = a.prefix
        delete a.suffix
        delete a.prefix
        return {
            stem: stem,
            prefix: prefix,
            suffix: suffix
        }
    })

    var needWrapper = lexeme.some(hasFix)

    if (needWrapper) {
        var buffer = bufferChildren(lexeme)
        if (isRepeat) {
            return buffer.join('\n')
        }
        buffer.unshift('(function(){', 'var vnodes = []')
        buffer.push('return vnodes', '})()')
        return buffer.join('\n')
    } else {
        var nodes = []
        for (var i = 0, el; el = lexeme[i++];) {
            if (el.stem) {
                nodes.push(el.stem)
            }
        }
        return '[' + nodes + ']'
    }
}


function serializeNode(node, skip) {
    switch (node.nodeName) {
        case '#text':
            if (!skip && config.rexpr.test(node.nodeValue)) {
                node.dynamic = {}
                var binding = parseText(node.nodeValue)
                return '{nodeName:"#text",dynamic:{},nodeValue:' + avlaon.parseExpr(binding) + '}'
            } else {
                return jsonfy(node)
            }
        case '#comment':
            if (node.forExpr) {// 处理ms-for指令
                return serializeFor(node, skip)
            } else if (!skip && node.nodeValue.indexOf('ms-if:') === 0) {
                return serializeLogic(node, skip)
            } else {
                return jsonfy(node)
            }
        default:
            return serializeTag(node, skip)
    }
}

function serializeTag(vdom, skip) {
    var props = vdom.props
    var copy = {
        nodeName: vdom.nodeName
    }
    if (props && !skip) {
        skip = 'ms-skip' in props
        var bindings = skip ? [] : extractBindings(copy, props)
        if (bindings.length) {
            vdom.dynamic = {}
            copy.dynamic = '{}'
            for (var i = 0, binding; binding = bindings[i++];) {
                //将ms-*的值变成函数,并赋给copy.props[ms-*]
                //如果涉及到修改结构,则在vdom添加prefix, suffix
                directives[binding.type].parse(copy, vdom, binding)
            }
        }
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
    return jsonfy(copy)
}


function serializeFor(vdom) {
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
    return jsonfy(copy)
}

function serializeLogic(vdom) {
    var nodeValue = vdom.nodeValue
    var statement = parseExpr({
        expr: nodeValue.replace('ms-js:', ''),
        type: 'js'
    })
    var match = statement.match(rstatement)
    if (match && match[1]) {
        vdom.suffix = (vdom.suffix || '') + statement +
            "\n__local__." + match[1] + ' = ' + match[1] + '\n'
    } else {
        avalon.warn(nodeValue + ' parse fail!')
    }
    return jsonfy(vdom)
}



function addTag(a) {
    return 'vnodes.push(' + a + ')'
}

//判定目标对象是否拥有prefix, suffix
function hasFix(a) {
    return a.prefix || a.suffix
}

function bufferChildren(nodes) {
    var buffer = []
    for (var i = 0, node; node = nodes[i++];) {
        if (node.prefix) {
            buffer.push(node.prefix)
        }
        if (node.stem) {
            buffer.push(addTag(node.stem))
        }
        if (node.suffix) {
            buffer.push(node.suffix)
        }
    }
    return buffer
}
