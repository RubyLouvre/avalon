
var componentQueue = []
var resolvedComponents = avalon.resolvedComponents
var rcomponentTag = /^(\w+\-w+|wbr|xmp|template)$/
avalon.component = function (name, definition) {
    if (typeof name === 'string') {
        //这里是定义组件的分支
        avalon.components[name] = definition
        var vms = {}
        for (var i = 0, obj; obj = componentQueue[i]; i++) {
            if (name === obj.name) {
                componentQueue.splice(i, 1)
                i--
                var vid = obj.vm.$id.split('.')[0]
                vms[vid] = true
            }
        }

        for (var id in vms) {
            avalon.batch(id, true)
        }
        //这里没有例回值
    } else {

        //判定这个组件是否用了插槽,如果用了插槽,
        var node = name //node为页面上节点对应的虚拟DOM
        var vm = definition
        var wid = node.props.wid
        var options = node.props['ms-widget']
        var tagName = node.type.indexOf('-') > 0 ? node.type : options.$type
        //如果组件模板已经定
        var hasResolved = resolvedComponents[wid]
        if (hasResolved) {
            //重新渲染自己  
            return hasResolved.render(hasResolved.vmodel)
        } else if (!avalon.components[tagName]) {
            componentQueue.push({
                node: node,
                vm: vm,
                type: tagName
            })
            return {type: '#comment', nodeValue: name + " component is undefined!"}
        } else {
            //页面上的节点是用于传参的
            //通过插件的template字符串生成的节点，是来授参执行的
            var type = node.type
            if (rcomponentTag.test(type)) {
                avalon.warn(type + "不合适做组件的标签")
            }
            if (type === 'xmp' || type === 'template' || node.children.length === 0) {
                node.children = avalon.lexer(node.template)
            }
            definition = avalon.components[tagName]
            var vtree = avalon.lexer(definition.template.trim())
            if (vtree.length > 1) {
                avalon.error("组件必须用一个元素包起来")
            }
            if (vtree[0].type !== tagName) {
                avalon.error("模板容器标签必须为" + tagName)
            }
            if (!node.isVoidTag) {//如果不是半闭合标签，那么其里面可能存在
                insertSlots(vtree, node)
            }
            //生成组件的render

            var define = options.define || definition.define
            options.$id = options.$id || makeHashCode(tagName)
            delete options.$type
            var vmodel = define(vm, definition.defaults, options)
            avalon.vmodels[vmodel.$id] = vmodel

            var widgetRender = avalon.render(vtree)
            var widgetNode = widgetRender(vmodel)
            widgetNode.props['ms-widget'] = options
            resolvedComponents[wid] = {
                render: render,
                vmodel: vmodel
            }
            widgetNode.vmodel = vmodel
            vmodel.$fire("$init", widgetNode)

            widgetNode.afterChange = widgetNode.afterChange || []
            widgetNode.afterChange.push(afterChange)
            return widgetNode

        }
    }
}

function afterChange(node, vnode, parent) {
    var isReady = true
    if (componentQueue.length !== 0) {
        try {
            hasUnresolvedComponent(vnode)
        } catch (e) {
            isReady = false
        }
    }
    if (isReady) {
        vnode.vmodel.$fire('$ready', node)
    }
}
//如果组件没有resolved,元素会是这样子:
//<ms-button wid='w453156877309' ms-widget='undefined'>xxx</ms-button>
function hasUnresolvedComponent(vnode) {
    vnode.children.forEach(function (el) {
        if (el.type.charAt(0) !== '#') {
            if ('ms-widget' in el.props) {
                throw 'unresolved'
            }
            hasUnresolvedComponent(el)
        }
    })
}



function insertSlots(vtree, node) {
    var slots = {}
    node.children.forEach(function (el) {
        if (el.type.charAt(0) !== '#') {
            var name = el.props.slot || ''
            if (slots[name]) {
                slots[name].push(el)
            } else {
                slots[name] = [el]
            }
        }
    })
    mergeTempale(vtree, slots)
}

function mergeTempale(vtree, slots) {
    for (var i = 0, node; node = vtree[i++]; ) {
        if (node.type.charAt(0) !== '#') {
            if (node.type === 'slot') {
                var name = node.props.name || ''
                if (slots[name]) {
                    vtree.splice.apply(vtree, [i - 1, 1].concat(slots[name]))
                }
            } else {
                mergeTempale(node.children, slots)
            }
        }
    }
    return vtree
}
avalon.enablePrefix = function (name, opts) {
    if (document.namespaces) {
        document.namespaces.add(name, 'http://www.w3.org/1999/xhtml');
    }
}

avalon.enablePrefix('ms')
