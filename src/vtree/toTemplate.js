import { parseAttributes } from '../parser/attributes'
import { parseInterpolate } from '../parser/interpolate'
import { keyMap, createExpr } from '../parser/index'
import { avalon, config } from '../seed/core'



export function Yield(nodes, render) {
    this.render = render
    var body = this.genChildren(nodes)
    this.body = body
    this.exec = Function('__vmodel__', 'Ʃ', 'return ' + body)
}
Yield.prototype = {
    genChildren(nodes) {
        if (nodes.length) {
            return '[' + nodes.map(function(node) {
                return this.genNode(node)
            }, this) + ']'
        } else {
            return '[]'
        }
    },

    genNode(node) {
        if (node.vtype === 1) {
            return this.genElement(node)
        } else if (node.vtype === 8) {
            return this.genComment(node)
        } else {
            return this.genText(node)
        }
    },
    genText(node) {
        if (node.dynamic) {
            return `Ʃ.text( ${ createExpr( parseInterpolate(node.nodeValue) ) } )`
        }
        return 'Ʃ.text(${avalon.quote(node.nodeValue)})'
    },
    genComment(node) {
        return `{nodeName:"#comment",vtype: 8, nodeValue: ${ avalon.quote(node.nodeValue.trim()) } }`
    },
    genElement(node) {
        if (node.staticRoot) {
            var index = this.render.staticIndex++
                this.render.staticTree[index] = node
            return `Ʃ.static(${index})`
        }
        var dirs = node.dirs
        if (dirs) {
            var hasCtrl = dirs['ms-controller']
            delete dirs['ms-controller']
            if (dirs['ms-text']) {
                var expr = parseInterpolate(config.openTag + dirs['ms-text'] + config.closeTag)
                var code = createExpr(expr, 'text')
                node.template = `[Ʃ.text( ${code} )]`
                delete dirs['ms-text']
                delete dirs['ms-html']
            }

            if (dirs['ms-html']) {
                //变成可以传参的东西
                node.template = `Ʃ.html( ${ createExpr(dirs['ms-html'])}, __vmodel__ )`

                delete dirs['ms-html']
            }

            if (!Object.keys(dirs).length) {
                dirs = null
            }
        }
        var json = toJSONByArray(
            `nodeName: "${node.nodeName}"`,
            `vtype: ${node.vtype}`,
            node.isVoidTag ? 'isVoidTag:true' : '',
            node.static ? 'static:true' : '',
            dirs ? this.genDirs(dirs, node) : '',
            `props: ${toJSONByObject(node.props)}`,
            `children: ${ node.template || this.genChildren(node.children)}`

        )
        if (hasCtrl) {
            return `Ʃ.ctrl(${avalon.quote(hasCtrl)}, __vmodel__,function(__vmodel__){ 
                 return ${json}
             })`
        } else {
            return json
        }
    },

    genDirs(dirs, node) {
        var arr = parseAttributes(dirs, node)
        if (arr.length) {
            return 'dirs:[' + arr.map(function(dir) {
                return toJSONByArray(
                    `type: ${avalon.quote(dir.type)}`,
                    `attrName:${avalon.quote(dir.attrName)}`,
                    dir.param ? `param:${avalon.quote(dir.param)}` : '',
                    `expr:${createExpr(dir.expr)}`
                )
            }) + ']'
        }
        return ''
    }

}

var rneedQuote = /[W\:-]/

function fixKey(k) {
    return (rneedQuote.test(k) || keyMap[k]) ? avalon.quote(k) : k
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
        arr.push(`${ fixKey(i)   }:${avalon.quote(obj[i])}`)
    }
    return '{' + arr + '}'
}