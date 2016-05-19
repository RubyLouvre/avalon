
var VText = require('../vdom/VText')
var parseView = require('../strategy/parser/parseView')
var resolvedComponents = avalon.resolvedComponents
var componentContainers = {wbr:1, xmp:1, template: 1}
var componentEvents = avalon.oneObject('onInit,onReady,onViewChange,onDispose')

var needDel = avalon.mix({
    is: 1,
    diff: 1,
    define: 1,
    cached: 1
}, componentEvents)
avalon.document.createElement('slot')

avalon.component = function (name, definition) {
    //这是定义组件的分支,并将列队中的同类型对象移除
    if (typeof name === 'string') {
        if (!avalon.components[name]) {
            avalon.components[name] = definition
        }//这里没有返回值
    } else {

        var node = name //node为页面上节点对应的虚拟DOM
        var topVm = definition
        var wid = node.props.wid
        //处理ms-widget的参数
        var optionMixin = {}
        function mixinHooks(option, index) {
            for (var k in option) {
                  if(!option.hasOwnProperty(k))
                      continue
                   var v = option[k]
                if (componentEvents[k]) {
                    if (k in optionMixin) {
                        optionMixin[k].push(v)
                    } else {
                        optionMixin[k] = [option[k]]
                    }
                } else if (isFinite(index)) {
                    optionMixin[k] = v
                }
            }
        }
        var options = node.props['ms-widget'] || {}
        options = Array.isArray(options) ? options : [options]
        options.forEach(mixinHooks)
        if(optionMixin.cached){
            var cachedVm = avalon.vmodels[optionMixin.$id]
            if(cachedVm){
                var _wid =  cachedVm.$events.__wid__ 
                delete resolvedComponents[wid]
                wid = _wid    
            }
        }
      
        var docker = resolvedComponents[wid]
        if (!docker) {
            resolvedComponents[wid] = node
            docker = node
        }
        //如果此组件的实例已经存在,那么重新渲染
        if (docker.render) {
            return docker
        } 
        var tagName = node.type.indexOf('-') > 0 ? node.type : optionMixin.is
        var placeholder = {
            nodeType: 8,
            type: '#comment',
            directive: 'widget',
            props: {'ms-widget': wid},
            nodeValue: 'ms-widget placeholder'
        }
        if (!avalon.components[tagName]) {
            //如果组件还没有定义,那么返回一个注释节点占位
            return placeholder
        } else {
            var type = node.type
            //判定用户传入的标签名是否符合规格
            if (!componentContainers[type] && !isCustomTag(type)) {
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
            if (widgetNode.type !== tagName) {
                avalon.warn('模板容器标签最好为' + tagName)
            }
            //将用户标签中的属性合并到组件标签的属性里
            for (var k in docker.props) {
                if(k !== 'ms-widget'){
                    widgetNode.props[k] = docker.props[k]
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
            var diff = optionMixin.diff
            var define = optionMixin.define
            define = define || avalon.directives.widget.define
            var $id = optionMixin.$id || avalon.makeHashCode(tagName.replace(/-/g, '_'))

            var defaults = definition.defaults
            mixinHooks(defaults, false)
            var defineArgs = [topVm, defaults].concat(options)
            var vmodel = define.apply(function (a, b) {
                for (var k in needDel) {
                    delete a[k]
                    delete b[k]
                }
            }, defineArgs)
            vmodel.$id = $id
            vmodel.$element = topVm.$element
            avalon.vmodels[$id] = vmodel
            for (k in componentEvents) {
                if (optionMixin[k]) {
                    optionMixin[k].forEach(function (fn) {
                        vmodel.$watch(k, fn)
                    })
                }
            }

            //生成组件的render
            var num = num || String(new Date - 0).slice(0, 6)
            var render = parseView(vtree, num) + '\nreturn (avalon.__widget = vnodes' + num + ');\n'
            vmodel.$render = topVm.$render
            vmodel.$events.__wid__ = wid
            //触发onInit回调
            vmodel.$fire('onInit', {
                type: 'init',
                vmodel: vmodel,
                wid: wid,
                target: null
            })

            avalon.shadowCopy(docker, {
                diff: diff,
                render: render,
                vmodel: vmodel,
                cached: !!optionMixin.cached,
                placeholder: placeholder
            })
            return docker
        }
    }
}

var ralphabet = /^[a-z]+$/

function isCustomTag(type) {
    return type.length > 3 && type.indexOf('-') > 0 &&
            ralphabet.test(type.charAt(0) + type.slice(-1))
}
avalon.renderComponent = function (widgetNode) {
    var docker = avalon.resolvedComponents[widgetNode.props.wid]
    var order = widgetNode.order
    
    widgetNode.order = order ? 
        'ms-widget;;' + order : 'ms-widget'
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
        if (el.nodeType === 8 && el.props) {
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
                    var s = slots[name]
                    vtree.splice.apply(vtree, [i - 1, 1].concat(s))
                    if (s.length === 1 && s[0].nodeType === 3) {
                        removeEmptyText(vtree)
                    }
                }
            } else {
                mergeTempale(node.children, slots)
            }
        }
    }

    return vtree
}

function removeEmptyText(nodes) {
    //如果定义组件时,slot元素两旁有大片空白,且slot元素又是被一个文本节点替代时,需要合并这三个文本节点
    for (var i = 0, el; el = nodes[i]; i++) {
        if (el.skipContent === false && el.nodeType === 3) {
            var pre = nodes[i - 1]
            var next = nodes[i + 1]
            if (pre && pre.nodeType === 3 && !/\S/.test(pre.nodeValue)) {
                avalon.Array.remove(nodes, pre)
                --i
            }
            if (next && next.nodeType === 3 && !/\S/.test(next.nodeValue)) {
                avalon.Array.remove(nodes, next)
            }
        }
    }
}
