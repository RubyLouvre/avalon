/**
 * ------------------------------------------------------------
 * diff 对比新旧两个虚拟DOM树,根据directive中的diff方法为新虚拟DOM树
 * 添加change, afterChange更新钩子
 * ------------------------------------------------------------
 */
var emptyArr = []
// 防止被引用
var emptyObj = function () {
    return {
        children: [], props: {}
    }
}
var directives = avalon.directives
var rbinding = /^ms-(\w+)-?(.*)/

function diff(copys, sources) {
    for (var i = 0; i < copys.length; i++) {
        var copy = copys[i]
        var src = sources[i] || copys[i]
        switch (copy.nodeName) {
            case '#text':
                if (copy.dynamic) {
                    var curValue = copy.nodeValue + ''
                    if (curValue !== src.nodeValue) {
                        src.nodeValue = curValue
                        if (src.dom) {
                            src.dom.nodeValue = curValue
                        }
                    }
                }
                break
            case '#comment':
                if (copy.forExpr) {//比较循环区域的元素位置
                    directives['for'].diff(copy, src, copys, sources, i)
                } else if (src.afterChange) {
                    execHooks(src, src.afterChange)
                }
                break
            case void(0):
                diff(copy, src)//比较循环区域的内容
                break
            case '#document-fragment':
                diff(copy.children, src.children)//比较循环区域的内容
                break
            default:
                if (copy.dynamic) {
                    var index = i
                    if (copy['ms-widget']) {
                        avalon.directives['widget'].diff(copy, src, 'ms-widget', copys, sources, index)
                        copy = copys[i]
                        src = sources[i] || emptyObj()
                        delete copy['ms-widget']
                    }

                    if ('ms-if' in copy) {
                        avalon.directives['if'].diff(copy, src, 'ms-if', copys, sources, index)
                        copy = copys[i]
                        src = sources[i] || emptyObj()
                        delete copy['ms-if']
                    }
                    diffProps(copy, src)
                }

                if (/^\w/.test(copy.nodeName) && !copy.skipContent && !copy.isVoidTag) {
                    diff(copy.children, src.children || [])
                }

                if (src.afterChange) {
                    execHooks(src, src.afterChange)
                }
                break
        }
    }
}

function execHooks(el, hooks) {
    if (hooks.length) {
        for (var hook, i = 0; hook = hooks[i++]; ) {
            hook(el.dom, el)
        }
    }
    delete el.afterChange
}

function diffProps(copy, source) {
    var directives = avalon.directives
    try {
        for (var name in copy) {
            var match = name.match(rbinding)
            var type = match && match[1]
            if (directives[type]) {
                directives[type].diff(copy, source, name)
            }
        }

    } catch (e) {
        avalon.warn(type, e, e.stack || e.message, 'diffProps error')
    }
}
avalon.diff = diff
avalon.diffProps = diffProps
module.exports = diff
