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
        var src = sources[i] || emptyObj()

        switch (copy.nodeType) {
            case 3:
                if (copy.dynamic) {
                    directives.expr.diff(copy, src)
                }
                break
            case 8:
                if (copy.dynamic === 'for') {//比较循环区域的元素位置
                    directives['for'].diff(copy, src, copys, sources, i)
                } else if (src.afterChange) {
                    execHooks(src, src.afterChange)
                }
                break
            case 1:
                if (copy.order) {
                    diffProps(copys, sources, i)
                }
                copy = copys[i]
                src = sources[i]
                if (copy.nodeType === 1 && !copy.skipContent && !copy.isVoidTag) {
                    diff(copy.children, src && src.children || [])
                }
                if (src && src.afterChange) {
                    execHooks(src, src.afterChange)
                }
                break
            default:
                if (Array.isArray(copy)) {
                    diff(copy, src)//比较循环区域的内容
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

function diffProps(copys, sources, index) {
    var order = copys[index].order
    if (order) {
        var oldOrder = order
        try {
            var arr = order.match(avalon.rword)
            var checked = {}
            for(var i = 0; i < arr.length; i++){
                var name = arr[i]
                
                if (checked[name]) {
                    continue
                } else {
                    checked[name] = 1
                }
                var match = name.match(rbinding)
                var type = match && match[1]
                if (directives[type]) {
                    directives[type].diff(copys[index], sources[index] || emptyObj(), name, copys, sources, index)
                }
                var newOrder = copys[index].order
                if (!newOrder) {
                    arr.splice(0, arr.length)
                } else if (newOrder !== oldOrder) {
                    arr.push.apply(arr, newOrder.match(avalon.rword))
                }
            }

        } catch (e) {
            avalon.warn(type, e, e.stack || e.message, 'diffProps error')
        }
    }
}
avalon.diffProps = diffProps
module.exports = diff
