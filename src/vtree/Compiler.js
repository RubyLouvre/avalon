import { avalon, config, directives } from '../seed/core'

import { collectDeps } from '../vmodel/transaction'
import { createExpr,keyMap, parseInterpolate, parseAttributes } from '../parser/index'
import { Render } from './Render'
/**
 * Compiler方法会将一堆虚拟DOM根据作用域划分为多个Render
 */
export function Compiler(vnodes, vm, force) {
    //这里需要第二个配置项，用于防止多次扫描
    this.renders = []
    var body = this.genChildren(vnodes, null)
    if (force && vm) {
        return new Render(vm, vnodes, body)
    }
}

Compiler.prototype = {
    genChildren(nodes, scope) {
        if (nodes.length) {
            var arr = []
            nodes.forEach(function(node) {
                var a = this.genNode(node, scope)
                if (a) {
                    arr.push(a)
                }
            }, this)
            return '[' + arr.join(',\n') + ']'
        } else {
            return '[]'
        }
    },

    genNode(node, scope) {
        if (node.props) {
            return this.genElement(node, scope)
        } else if (node.nodeName === '#comment') {
            return this.genComment(node)
        } else if (node.nodeName === '#text') {
            return this.genText(node)
        }
    },
    genText(node) {
        if (node.dynamic) {
            return `\u01A9.text( ${ createExpr( parseInterpolate(node.nodeValue)) },${true})`
        }
        return `\u01A9.text( ${avalon.quote(node.nodeValue)} )`
    },
    genComment(node) {
        if (node.dynamic) {
            var dir = node.for
            directives['for'].parse.call(dir)
            var keys = `'${dir.valName},${dir.keyName},${dir.asName},${dir.cb}'`
            return `{nodeName:'#comment',vm:__vmodel__, local:$$l,nodeValue:${avalon.quote(node.nodeValue)}},
                    \u01A9.repeat(${ createExpr(dir.expr) }, ${keys}, function($$l){
                return ${this.genChildren(dir.nodes)}
            })`
        }

        return `\u01A9.comment(${avalon.quote(node.nodeValue)})`
    },
    genComponent(node, dirs) {
        for (var i in dirs) {
            if (i !== 'ms-widget')
                delete dirs[i]
        }
        var json = toJSONByArray(
            `nodeName: '${node.nodeName}'`,
            this.genDirs(dirs, node),
            'vm: __vmodel__',
            'slots: slots',
            `props: ${toJSONByObject(node.props)}`,
            `children: ${this.genChildren(node.children)}`
        )
        var _children = node._children
        delete node._children
        return `(function() {
                var slots = {}
                var slotedElements = ${this.genChildren(_children)}
                return ${ json }
            })()`

    },
    genElement(node, scope) {
        if (node.nodeName === 'slot') {
            return `\u01A9.slot(${ avalon.quote(node.props.name || "defaults") })`
        }

        if (node.staticID) {
            return `\u01A9.static(${ node.staticID })`
        }
        var dirs = node.dirs,
            props = node.props

        if (dirs) {
            //优化处理指令
            if (dirs['ms-widget']) {
                return this.genComponent(node, dirs, scope)
            }
            var hasCtrl = dirs['ms-controller'] || dirs['ms-important']
            var isImport = 'ms-important' in dirs
                //判定其原上方是否有vm
            var topScope = scope
            var scope = avalon.vmodels[hasCtrl]
                //处理各种指令的冲突,因为有的指令出现后,另一些指令需要无效化
                //比如ms-text的优先级向于ms-html
            if (dirs['ms-text']) {
                var expr = parseInterpolate(config.openTag + dirs['ms-text'] + config.closeTag)
                var code = createExpr(expr, 'text')
                node.template = `[\u01A9.text(${ code })]`
                node.children = [{ dynamic: true, nodeName: '#text', nodeValue: NaN }]
                removeDir('text', dirs, props)
                removeDir('html', dirs, props)
            }


            if (dirs['ms-if']) {
                //变成可以传参的东西
                var hasIf = createExpr(dirs['ms-if'])
                removeDir('if', dirs, props)
            }

            if (!Object.keys(dirs).length) {
                delete node.dirs
                dirs = null
            }

        }

        var json = toJSONByArray(
                `nodeName: '${node.nodeName}'`,
                node.vtype ? `vtype: ${ node.vtype }` : '',
                dirs ? 'vm: __vmodel__' : '',
                dirs ? 'local: $$l' : '',
                `props: ${ toJSONByObject(node.props) }`,
                node.staticID ? 'staticID: ' + node.staticID : '',
                dirs ? this.genDirs(dirs, node) : '',
                `children: ${ node.template || this.genChildren(node.children, scope) }`
            )
            //将slot属性变成collectSlot方法
        if (node.props.slot) {
            json = `\u01A9.collectSlot(${json},slots)`
        }
        //将ms-if指令变成三目运算符
        if (hasIf) {
            json = `${ hasIf } ? ${ json } : \u01A9.comment('if')`
        }
        //将作用域指令变成ctrl方法
        if (hasCtrl) {
            var render = new Render(scope, [node], '[' + json + ']')
            if (!topScope) {
                this.renders.push(render)
            } else {
                render.noDiff = true
                collectDeps(render, render.update)
                render.noDiff = false
            }
            //如果存在两个ms-controller,它们会产生融合vm, 当底层的vm的属性变动时,
            //它可能让上面的vm进行diff,或可能让融合vm进行diff
            return `\u01A9.ctrl( ${ avalon.quote(hasCtrl) }, __vmodel__, ${isImport}, function(__vmodel__, _1,_2) {
                var a = ${json}
                a.curVm = _1
                a.topVm = _2
                return a
            }) `
        } else {
            return json
        }
    },

    genDirs(dirs, node) {
        var arr = parseAttributes(dirs, node)
        if (arr.length) {
            node.dirs = arr
            return 'dirs:[' + arr.map(function(dir) {
                if (dir.type === 'duplex') {
                    return this.genDuplex(dir, node)
                }
                return toJSONByArray(
                    `type: ${ avalon.quote(dir.type) }`,
                    `name: ${ avalon.quote(dir.name) }`,
                    dir.param ? `param: ${ avalon.quote(dir.param) }` : '',
                    `value: ${ /^(?:controller|important|on)$/.test(dir.type) ? avalon.quote(dir.expr) : createExpr(dir.expr) }`
                )
            }, this) + ']'
        }
        return ''
    },
    genDuplex(dir, node) {
        //抽取里面的change, debounce过滤器为isChanged， debounceTime
        directives.duplex.parse(dir, node)
        return toJSONByArray(
            dir.isChecked ? `isChecked: ${ dir.isChecked }` : '',
            dir.isChange ? `isChange: ${ dir.isChange }` : '',
            dir.debounceTime ? `debounceTime: ${ dir.debounceTime }` : '',
            dir.cb ? `cb: ${ avalon.quote(dir.cb) }` : '',
            dir.parsers ? `parsers: ${ avalon.quote(dir.parsers) }` : '',
            `dtype: ${ avalon.quote(dir.dtype) }`,
            `type: ${ avalon.quote(dir.type) }`,
            `expr: ${ avalon.quote(dir.expr) }`,
            `name: ${ avalon.quote(dir.name) }`,
            `value: ${ createExpr(dir.expr) }`
        )
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
        arr.push(`${ fixKey(i) }: ${ avalon.quote(obj[i]) }`)
    }
    return '{' + arr + '}'
}