import { parseAttributes } from '../parser/attributes'
import { parseInterpolate } from '../parser/interpolate'
import { keyMap } from '../parser/index'

export function toTemplate(nodes, render) {
    return genChildren(nodes, render)
}

function genChildren(nodes, render) {
    if (nodes.length) {
        return '[' + nodes.map(function(node) {
            return genNode(node, render)
        }) + ']'
    } else {
        return '[]'
    }
}

function genNode(node, render) {
    if (node.vtype === 1) {
        return genElement(node, render)
    } else {
        return genText(node)
    }
}

function genText(node) {
    if (node.dynamic) {
        console.log(parseInterpolate(node))
        return `__render__.s( ${ parseInterpolate(node) } )`
    }
    return '__render__.s(${avalon.quote(node.nodeValue)})'
}



function genElement(node, render) {
    if (node.staticRoot) {
        var index = render.staticIndex++
        render.staticTree[index] = node
        return `__render__.s(${index})`
    }
    var dirs = node.dirs
    if (dirs) {
        var hasCtrl = dirs['ms-controller']
        delete dirs['ms-controller']
        if (!Object.keys(dirs).length) {
            dirs = null
        }
    }
    var json = toJSONByArray(
        `nodeName: "${node.nodeName}"`,
        `vtype: ${node.vtype}`,
        node.isVoidTag ? 'isVoidTag:true' : '',
        node.static ? 'static:true' : '',
        dirs ? genDirs(dirs, node) : '',
        node.props ? `props: ${toJSONByObject(node.props)}` : '',
        node.children ? `children: ${genChildren(node.children, render)}` : ''
    )
    if (hasCtrl) {
        return `__render__.ctrl(${avalon.quote(hasCtrl)}, __vmodel__,function(__vmodel__){ 
                 return ${json}
             })`
    } else {
        return json
    }
}

function toJSONByArray() {
    return '{' + avalon.slice(arguments, 0).filter(function(el) {
        return el
    }).join(',') + '}'
}

function toJSONByObject(obj) {
    var arr = []
    for (var i in obj) {
        if (obj[i] === undefined || obj[i] === '')
            continue
        arr.push(`${ i in keyMap ? avalon.quote(i): i   }:${avalon.quote(obj[i])}`)
    }
    return '{' + arr + '}'
}

function genDirs(dirs, node) {
    var arr = parseAttributes(dirs, node)
    if (arr.length) {
        return '{dirs:[' + arr.forEach(function(dir) {
            delete dir.priority
            return toJSONByObject(dir)
        }) + ']}'
    }
    return ''
}