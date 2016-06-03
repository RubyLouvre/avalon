
var VText = require('../vdom/VText')
var parseView = require('../strategy/parser/parseView')
var resolvedComponents = avalon.resolvedComponents
var skipArray = require('../vmodel/parts/skipArray')

var componentContainers = {wbr: 1, xmp: 1, template: 1}
var events = 'onInit,onReady,onViewChange,onDispose'
var componentEvents = avalon.oneObject(events)
var protected = events.split(',').concat('is', 'diff', 'define', 'cached')

var unresolvedComponent = {
    nodeType: 8,
    type: "#comment",
    directive: 'widget',
    nodeValue: 'unresolved component placeholder'
}
avalon.component = function (name, definition, wid) {
    //这是定义组件的分支,并将列队中的同类型对象移除
    if (typeof wid !== 'string') {
        if (!avalon.components[name]) {
            avalon.components[name] = definition
        }//这里没有返回值
    } else {
        var root = name //root为页面上节点对应的虚拟DOM
        var docker = resolvedComponents[wid]
        if (docker && docker.render) {
            avalon.log("立即返回")
            return docker
        }
        var topVm = definition
        var finalOptions = {}
        var options = [].concat(root['ms-widget'] || [])
        options.forEach(function (option, index) {
            //收集里面的事件
            mixinHooks(finalOptions, option, index)
        })
        //得到组件的is类型 
        var componentName = root.type.indexOf('-') > 0 ?
                root.type : finalOptions.is
        //得到组件在顶层vm的配置对象名   
        var configName = componentName.replace(/-/g, '_')
        if (topVm.hasOwnProperty(configName) &&
                typeof topVm[configName] === 'object') {
            //如果定义了,那么全部舍弃
            finalOptions = {}
            options = [topVm[configName]]
            mixinHooks(finalOptions, topVm[configName], 0)
            protected = [configName].concat(protected)
        }
        if (finalOptions.cached) {
            var cachedVm = avalon.vmodels[finalOptions.$id]
            if (cachedVm) {
                var _wid = cachedVm.$events.__wid__
                if (wid !== _wid) {
                    delete resolvedComponents[wid]
                    wid = _wid
                }
            }
        }
        docker = resolvedComponents[wid]
        if (!docker) {
            resolvedComponents[wid] = root
            docker = root
        }

        //如果此组件的实例已经存在,那么重新渲染
        if (docker.render) {
            return docker
        }

        if (!avalon.components[componentName]) {
            //如果组件还没有定义,那么返回一个注释节点占位
            return unresolvedComponent
        } else {
            //=======对用户的自定义标签进行处理===========
            var type = root.type
            //判定用户传入的标签名是否符合规格
            if (!componentContainers[type] && !isCustomTag(type)) {
                avalon.warn(type + '不合适做组件的标签')
            }
            //将用户声明组件用的自定义标签(或xmp.template)的template转换成虚拟DOM
            if (type === 'xmp' || type === 'template' || root.children.length === 0) {
                root.children = avalon.lexer(docker.template)
            }
            //对于IE6-8,需要对自定义标签进行hack
            definition = avalon.components[componentName]
            if (!avalon.modern && !definition.fixTag) {
                avalon.document.createElement(componentName)
                definition.fixTag = 1
            }

            //开始构建组件的vm的配置对象
            var diff = finalOptions.diff
            var define = finalOptions.define
            define = define || avalon.directives.widget.define

            var $id = finalOptions.$id ||
                    avalon.makeHashCode(configName)

            var defaults = avalon.mix(true, {}, definition.defaults)

            mixinHooks(finalOptions, defaults, false)

            defineArgs = [topVm, defaults].concat(options)

            var vmodel = define.apply(function (a, b) {
                protected.forEach(function (k) {
                    delete a[k]
                    delete b[k]
                })
            }, defineArgs)

            if (!avalon.modern) {//增强对IE的兼容
                for (var i in vmodel) {
                    if (!skipArray[i] && typeof vmodel[i] === 'function') {
                        vmodel[i] = vmodel[i].bind(vmodel)
                    }
                }
            }
            vmodel.$id = $id
            vmodel.$element = topVm.$element
            avalon.vmodels[$id] = vmodel
            var finalTemplate = definition.template.trim()
            if (typeof definition.getTemplate === 'function') {
                finalTemplate = definition.getTemplate(vmodel, finalTemplate)
            }
            //对组件内置的template转换成虚拟DOM
            var vtree = avalon.lexer(finalTemplate)
            if (vtree.length > 1) {
                avalon.error('组件必须用一个元素包起来')
            }
            var componentRoot = vtree[0]
            //  必须指定wid
            componentRoot.props.wid = wid
            //将用户标签中的属性合并到组件标签的属性里
            for (var k in docker.props) {
                if (k !== 'ms-widget') {
                    componentRoot.props[k] = docker.props[k]
                }
            }

            //抽取用户标签里带slot属性的元素,替换组件的虚拟DOM树中的slot元素
            if (definition.soleSlot) {
                var slots = {}
                var slotName = definition.soleSlot
                slots[slotName] = /\S/.test(docker.template) ? root.children :
                        new VText('{{@' + slotName + '}}')
                mergeTempale(vtree, slots)
            } else if (!root.isVoidTag) {
                insertSlots(vtree, root, definition.soleSlot)
            }
            for (k in componentEvents) {
                if (finalOptions[k]) {
                    finalOptions[k].forEach(function (fn) {
                        vmodel.$watch(k, fn)
                    })
                }
            }

            //生成组件的render
            var render = '(function(__vmodel__){' +
                    parseView(vtree) +
                    '})(docker.vmodel)'


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
                cached: !!finalOptions.cached
            })
            return docker
        }
    }
}
//必须以字母开头,结尾以字母或数字结束,中间至少出现一次"-",
//并且不能大写字母,特殊符号,"_","$",汉字
var rcustomTag = /^[a-z]([a-z\d]+\-)+[a-z\d]+$/

function isCustomTag(type) {
    return rcustomTag.test(type)
}

avalon.renderComponent = function (root, nodes, index, wid) {
    root = root && root.length ? root[0] : unresolvedComponent
    
    
    if (!isComponentReady(root)) {
        return nodes[index] = unresolvedComponent
    }
    var docker = avalon.resolvedComponents[wid]
    if (!docker.renderCount) {
        docker.renderCount = 1
    }
    
    root.wid = wid
    root.diff = docker.diff
    root.vmodel = docker.vmodel
    root.props['ms-widget'] = docker['ms-widget']
    root.order = ['ms-widget'].
            concat((root.order || '').split(';;')).join(';;')
    //移除skipAttrs,以便进行diff
    delete root.skipAttrs
    nodes[index] = root
}

function mixinHooks(target, option, index) {
    for (var k in option) {
        if (!option.hasOwnProperty(k))
            continue
        var v = option[k]
        if (componentEvents[k]) {
            if (k in target) {
                target[k].push(v)
            } else {
                target[k] = [option[k]]
            }
        } else if (isFinite(index)) {
            target[k] = v
        }
    }
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
            if (el === unresolvedComponent) {
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
