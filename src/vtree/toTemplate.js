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
            }, this).join(',\n') + ']'
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
            return `Ʃ.text( ${ createExpr( parseInterpolate(node.nodeValue) ) })`
        }
        return `Ʃ.text(${avalon.quote(node.nodeValue)})`
    },
    genComment(node) {
        if (node.dynamic) {
            var dir = node.for
            avalon.directives['for'].beforeInit.call(dir)
            var keys = `'${dir.valName},${dir.keyName},${dir.asName}'`
            return `Ʃ.comment('ms-for:${dir.expr}'),
                    Ʃ.repeat(${ createExpr(dir.expr) }, ${keys}, function(__local__){
                return ${this.genChildren(dir.nodes)}
            })`
        }


        return `Ʃ.comment(${avalon.quote(node.nodeValue)})`
    },
    genElement(node) {
        if (node.staticRoot) {
            var index = this.render.staticIndex++
                this.render.staticTree[index] = node
            return `Ʃ.static(${index})`
        }
        var dirs = node.dirs,
            props = node.props
        if (dirs) {
            var hasCtrl = dirs['ms-controller']
            delete dirs['ms-controller']
            if (dirs['ms-text']) {
                var expr = parseInterpolate(config.openTag + dirs['ms-text'] + config.closeTag)
                var code = createExpr(expr, 'text')
                node.template = `[Ʃ.text( ${code} )]`

                removeDir('text', dirs, props)
                removeDir('html', dirs, props)

            }

            if (dirs['ms-html']) {
                //变成可以传参的东西
                node.template = `Ʃ.html( ${ createExpr(dirs['ms-html'])}, __vmodel__ )`
                removeDir('html', dirs, props)
            }
            if (dirs['ms-if']) {
                //变成可以传参的东西
                var hasIf = createExpr(dirs['ms-if'])
                removeDir('if', dirs, props)
            }
            if (!Object.keys(dirs).length) {
                dirs = null
            }
        }
        var json = toJSONByArray(
            `nodeName: '${node.nodeName}'`,
            ` vtype: ${node.vtype}`,
            node.isVoidTag ? 'isVoidTag: true' : '',
            node.static ? 'static: true' : '',
            dirs ? this.genDirs(dirs, node) : '',
            `props: ${toJSONByObject(node.props)}`,
            `children: ${ node.template || this.genChildren(node.children)}`

        )
        if (hasIf) {
            json = `${hasIf}? ${json}: Ʃ.comment('if')`
        }
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
            node.dirs = arr
            return 'dirs:[' + arr.map(function(dir) {
                return toJSONByArray(
                    `type: ${avalon.quote(dir.type)}`,
                    `name: ${avalon.quote(dir.name)}`,
                    dir.param ? `param: ${avalon.quote(dir.param)}` : '',
                    `value: ${createExpr(dir.expr)}`
                )
            }) + ']'
        }
        return ''
    }

}

function removeDir(name, dirs, props) {
    delete dirs['ms-' + name]
    delete props['ms-' + name]
    delete props[':' + name]
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
        arr.push(`${ fixKey(i) }: ${avalon.quote(obj[i])}`)
    }
    return '{' + arr + '}'
}