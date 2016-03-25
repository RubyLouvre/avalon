
var componentQueue = []
var resolvedComponents = avalon.resolvedComponents
var rcomponentTag = /^(\w+\-w+|wbr|xmp|template)$/
var skip = {'ms-widget': 1, widget: 1, wid: 1}

avalon.component = function (name, definition) {
    if (typeof name === 'string') {
        //这里是定义组件的分支
        avalon.components[name] = definition
        for (var i = 0, obj; obj = componentQueue[i]; i++) {
            if (name === obj.type) {
                componentQueue.splice(i, 1)
                i--
            }
        }
        //这里没有返回值
    } else {

        var node = name //node为页面上节点对应的虚拟DOM

        var vm = definition
        var wid = node.props.wid

        var options = node.props['ms-widget']
        var tagName = node.type.indexOf('-') > 0 ? node.type : options.$type
        //如果组件模板已经定
        var placeholder = {
            type: '#comment',
            directive: 'widget',
            props: { wid: wid},
            nodeValue: 'ms-widget placeholder'
        }
        var docker = resolvedComponents[wid]

        if (docker.render) {
            //重新渲染自己  
            return reRender(docker)
        } else if (!avalon.components[tagName]) {
            componentQueue.push({
                type: tagName
            })
            return placeholder
        } else {
            //页面上的节点是用于传参的
            //通过插件的template字符串生成的节点，是来授参执行的
            var type = node.type
            if (!rcomponentTag.test(type)) {
                avalon.warn(type + '不合适做组件的标签')
            }
            if (type === 'xmp' || type === 'template' || node.children.length === 0) {
                node.children = avalon.lexer(node.template)
            }
            definition = avalon.components[tagName]
            var vtree = avalon.lexer(definition.template.trim())
            if (vtree.length > 1) {
                avalon.error('组件必须用一个元素包起来')
            }
            var widgetNode = vtree[0]
            if (widgetNode.type !== tagName) {
                avalon.warn('模板容器标签最好为' + tagName)
            }
            for (var i in docker.props) {
                if (!skip[i]) {
                    widgetNode.props[i] = docker.props[i]
                }
            }

            if (!node.isVoidTag) {
                //如果不是半闭合标签，那么里面可能存在插槽元素,抽取出来与主模板合并
                insertSlots(vtree, node)
            }
            delete options.$type
            delete options.$define
            var diff = options
            delete options.$diff

            var define = options.$define || avalon.directives.widget.define

            var $id = options.$id || avalon.makeHashCode(tagName.replace(/-/g, '_'))
            var vmodel = define(vm, definition.defaults, options)
            vmodel.$id = $id
            avalon.vmodels[$id] = vmodel
            //生成组件的render
            var render = avalon.render(vtree)
            vmodel.$render = render
            vmodel.$fire('onInit', vmodel)

            avalon.mix(docker, {
                render: render,
                vmodel: vmodel,
                diff: diff,
                placeholder: placeholder
            })

            return reRender(docker)
        }
    }
}

function reRender(docker) {
    var vtree = docker.render(docker.vmodel)
    var widgetNode = vtree[0]
    if (!isComponentReady(widgetNode)) {
        return docker.placeholder
    }
    if (!docker.renderCount) {
        docker.renderCount = 1
    } else {
        docker.renderCount++
    }
    widgetNode.props['ms-widget'] = docker.props['ms-widget']
    widgetNode.vmodel = docker.vmodel
    widgetNode.diff = docker.diff
    //移除skipAttrs,以便进行diff
    delete widgetNode.skipAttrs

    widgetNode.renderCount = docker.renderCount
    return widgetNode
}
function isComponentReady(vnode) {
    var isReady = true
    if (componentQueue.length !== 0) {
        try {
            hasUnresolvedComponent(vnode)
        } catch (e) {
            isReady = false
        }
    }
    return isReady
}

function hasUnresolvedComponent(vnode) {
    vnode.children.forEach(function (el) {
        if (el.type === '#comment') {
            if ('ms-widget' in el.props) {
                throw 'unresolved'
            }
        } else if (el.children) {
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

