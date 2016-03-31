
var VText = require('../vdom/VText')
var outerTags = avalon.oneObject('wbr,xmp,template')

var resolvedComponents = avalon.resolvedComponents
var skipWidget = {'ms-widget': 1, widget: 1, resolved: 1}

avalon.document.createElement('slot')

avalon.component = function (name, definition) {
    //这是定义组件的分支,并将列队中的同类型对象移除
    if (typeof name === 'string') {
        if (!avalon.components[name]) {
            avalon.components[name] = definition
        }
        //这里没有返回值
    } else {

        var node = name //node为页面上节点对应的虚拟DOM
        var vm = definition
        var wid = node.props.wid
        //将ms-widget的值合并成一个纯粹的对象,并且将里面的vm抽取vms数组中
        var options = node.props['ms-widget'] || {}
        var vms = []
        if (Array.isArray(options)) {
            vms = options.filter(function (el) {
                return el.$id
            })
            options = avalon.mix.apply({}, options)
        } else if (options.$id) {
            vms = [options]
        }
        //如果组件模板已经定
        var placeholder = {
            nodeType: 8,
            type: '#comment',
            directive: 'widget',
            props: {'ms-widget': wid},
            nodeValue: 'ms-widget placeholder'
        }

        var tagName = node.type.indexOf('-') > 0 ? node.type : options.is
        var docker = resolvedComponents[wid]
        //如果此组件的实例已经存在,那么重新渲染
        if (docker.render) {
            return reRender(docker)
        } else if (!avalon.components[tagName]) {
            //如果组件还没有定义,那么返回一个注释节点占位
            return placeholder
        } else {
           
            var type = node.type
            //判定用户传入的标签名是否符合规格
            if (!outerTags[type] && !isCustomTag(type)) {
                avalon.warn(type + '不合适做组件的标签')
            }
            //将用户声明组件用的自定义标签(或xmp.template)的template转换成虚拟DOM
            if (type === 'xmp' || type === 'template' || node.children.length === 0) {
                node.children = avalon.lexer(docker.template)
            }
            //对于IE6-8,需要对自定义标签进行hack
            definition = avalon.components[tagName]
            if (!avalon.modern && !definition.fixTag) {
                avalon.document.createElement(tagName)
                definition.fixTag = 1
            }
            //对组件内置的template转换成虚拟DOM
            var vtree = avalon.lexer(definition.template.trim())
            if (vtree.length > 1) {
                avalon.error('组件必须用一个元素包起来')
            }

            var widgetNode = vtree[0]
            widgetNode.props.resolved = true
            if (widgetNode.type !== tagName) {
                avalon.warn('模板容器标签最好为' + tagName)
            }
            //将用户标签中的属性合并到组件标签的属性里
            widgetNode
            for (var i in docker.props) {
                if (!skipWidget[i]) {
                    widgetNode.props[i] = docker.props[i]
                }
            }
            //抽取用户标签里带slot属性的元素,替换组件的虚拟DOM树中的slot元素
            if (definition.soleSlot) {
                var slots = {}
                var slotName = definition.soleSlot
                slots[slotName] = /\S/.test(docker.template) ? node.children : new VText('{{@' + slotName + '}}')
                mergeTempale(vtree, slots)
            } else if (!node.isVoidTag) {
                insertSlots(vtree, node, definition.soleSlot)
            }
            //开始构建组件的vm的配置对象
            var diff = options.$diff
            var define = options.$define
            define = define || avalon.directives.widget.define
            var $id = options.$id || avalon.makeHashCode(tagName.replace(/-/g, '_'))

            try { //options可能是vm, 在IE下使用delete会报错
                delete options.is
                delete options.$id
                delete options.$diff
                delete options.$define
            } catch (e) {
            }

            var vmodel = define(vm, definition.defaults, options, vms)
            vmodel.$id = $id
            avalon.vmodels[$id] = vmodel
            //生成组件的render
            var render = avalon.render(vtree)
            vmodel.$render = render
            //触发onInit回调
            vmodel.$fire('onInit', {
                type: 'init',
                vmodel: vmodel,
                target: null
            })
           
            avalon.shadowCopy(docker, {
                diff: diff,
                render: render,
                vmodel: vmodel,
                placeholder: placeholder
            })

            return reRender(docker)
        }
    }
}

var ralphabet = /^[a-z]+$/

function isCustomTag(type) {
    return type.length > 3 && type.indexOf('-') > 0 &&
            ralphabet.test(type.charAt(0) + type.slice(-1))
}

function reRender(docker) {
    var vtree = docker.render(docker.vmodel)
    var widgetNode = vtree[0]
    if (!isComponentReady(widgetNode)) {
        return docker.placeholder
    }
    if (!docker.renderCount) {
        docker.renderCount = 1
    }
    widgetNode.props['ms-widget'] = docker.props['ms-widget']
    widgetNode.vmodel = docker.vmodel
    widgetNode.diff = docker.diff
    //移除skipAttrs,以便进行diff
    delete widgetNode.skipAttrs

    return widgetNode
}
function isComponentReady(vnode) {
    var isReady = true
    try {
        hasUnresolvedComponent(vnode)
    } catch (e) {
        isReady = false
    }
    return isReady
}

function hasUnresolvedComponent(vnode) {

    vnode.children.forEach(function (el) {
        if (el.nodeType === 8) {
            if ('ms-widget' in el.props) {
                throw 'unresolved'
            }
        } else if (el.children) {
            hasUnresolvedComponent(el)
        }
    })
}

function insertSlots(vtree, node, soleSlot) {
    var slots = {}
    if (soleSlot) {
        slots[soleSlot] = node.children
    } else {
        node.children.forEach(function (el) {
            if (el.nodeType === 1) {
                var name = el.props.slot || 'default'
                if (slots[name]) {
                    slots[name].push(el)
                } else {
                    slots[name] = [el]
                }
            }
        })
    }
    mergeTempale(vtree, slots)
}

function mergeTempale(vtree, slots) {
    for (var i = 0, node; node = vtree[i++]; ) {
        if (node.nodeType === 1) {
            if (node.type === 'slot') {
                var name = node.props.name || 'default'
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

