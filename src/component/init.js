module.exports = initComponent

var skipArray = require('../vmodel/parts/skipArray')
var legalTags = {wbr: 1, xmp: 1, template: 1}
var events = 'onInit,onReady,onViewChange,onDispose'
var componentEvents = avalon.oneObject(events)
var immunity = events.split(',').concat('is', 'define')
var onceWarn = true

function initComponent(src, rawOption, local, template) {
    var tag = src.nodeName
    var is = src.props.is
    //判定用户传入的标签名是否符合规格
    /* istanbul ignore if */
    if (!legalTags[tag] && !isCustomTag(tag)) {
        avalon.warn(tag + '标签不能做组件容器')
        return
    }

    var definition = avalon.components[is]
    //如果连组件的定义都没有加载回来,应该立即返回 
    /* istanbul ignore if */
    if (!definition) {
        avalon.warn(is + '组件还没有加载')
        return
    }
    //开始初始化组件
    var hooks = {}
    //用户只能操作顶层VM
    //只有$id,is的对象就是emptyOption
    /* istanbul ignore if */
    if (!rawOption) {
        options = []
    } else {
        var options = [].concat(rawOption)
        options.forEach(function (a) {
            if (a && typeof a === 'object') {
                mixinHooks(hooks, (a.$model || a), true)
            }
        })
    }
    //得到组件在顶层vm的配置对象名
    var id = hooks.id || hooks.$id
    if (!id && onceWarn) {
        avalon.warn('warning!', is, '组件最好在ms-widget配置对象中指定全局不重复的$id以提高性能!\n',
                '若在ms-for循环中可以利用 ($index,el) in @array 中的$index拼写你的$id\n',
                '如 ms-widget="{is:\'ms-button\',id:\'btn\'+$index}"'
                )
        onceWarn = false
    }

    var define = hooks.define
    define = define || avalon.directives.widget.define
    //生成组件VM
    var $id = id || src.props.wid || 'w' + (new Date - 0)
    var defaults = avalon.mix(true, {}, definition.defaults)
    mixinHooks(hooks, defaults, false)

    var skipProps = immunity.concat()
    function sweeper(a, b, c) {
        skipProps.forEach(function (k) {
            delete a[k]
            delete b[k]
        })
        for (var k in c) {
            if (hooks[k]) {
                delete a[k]
            }
        }
    }

    sweeper.isWidget = true
    var vmodel = define.apply(sweeper, [src.vmodel, defaults].concat(options))
    //增强对IE的兼容
    /* istanbul ignore if */
    if (!avalon.modern) {
        for (var i in vmodel) {
            if (!skipArray[i] && typeof vmodel[i] === 'function') {
                vmodel[i] = vmodel[i].bind(vmodel)
            }
        }
    }

    vmodel.$id = $id
    avalon.vmodels[$id] = vmodel

    //绑定组件的生命周期钩子
    for (var e in componentEvents) {
        if (hooks[e]) {
            hooks[e].forEach(function (fn) {
                vmodel.$watch(e, fn)
            })
        }
    }
    // 生成外部的渲染函数
    // template保存着最原始的组件容器信息
    // 我们先将它转换成虚拟DOM,如果是xmp, template,
    // 它们内部是一个纯文本节点, 需要继续转换为虚拟DOM
    var templateID = 'temp:' + template
    if (!avalon.caches[templateID]) {
        var shell = avalon.lexer(template)
        avalon.variant(shell)
        shell[0].props.is = is
        avalon.caches[templateID] = avalon.render(shell, local)
    }
    var render1 = avalon.caches[templateID]
    //生成内部的渲染函数

    if (!definition.render) {
        var finalTemplate = definition.template.trim()
        var vtree = avalon.lexer(finalTemplate)

        if (vtree.length > 1) {
            avalon.error('组件必须用一个元素包起来')
        }
        var soleSlot = definition.soleSlot
        replaceSlot(vtree, soleSlot)
        avalon.variant(vtree)

        definition.render = avalon.render(vtree)
    }

    var render2 = definition.render
    function lastFn(vmodel, local) {
        var shell = render1(vmodel, local)
        var shellRoot = shell[0]
        var vtree = render2(vmodel, local);
        var component = vtree[0]
        //处理diff
        for (var i in shellRoot) {
            if (i !== 'children' && i !== 'nodeName') {
                if (i === 'props') {
                    avalon.mix(component.props, shellRoot.props)
                } else {
                    component[i] = shellRoot[i]
                }
            }
        }

        var soleSlot = definition.soleSlot
        var slots = collectSlots(shellRoot, soleSlot)
        if (soleSlot && (!slots[soleSlot] || !slots[soleSlot].length)) {
            slots[soleSlot] = [{
                    nodeName: '#text',
                    nodeValue: vmodel[soleSlot],
                    dynamic: true
                }]
        }
        insertSlots(vtree, slots)
        component.props.wid = vmodel.$id
       
        delete component.skipContent
        return vtree
    }

    //生成最终的组件渲染函数
    vmodel.$render = lastFn
    src['component-vm:' + is] = vmodel
    return  vmodel.$render = lastFn
}




function replaceSlot(vtree, slotName) {
    for (var i = 0, el; el = vtree[i]; i++) {
        if (el.nodeName === 'slot') {
            var name = el.props.name || slotName
            vtree.splice(i, 1, {
                nodeName: '#comment',
                nodeValue: 'slot:' + name,
                dynamic: true,
                type: name
            }, {
                nodeName: '#comment',
                nodeValue: 'slot-end:'
            })
            i++
        } else if (el.children) {
            replaceSlot(el.children, slotName)
        }
    }
}

function insertSlots(vtree, slots) {
    for (var i = 0, el; el = vtree[i]; i++) {
        if (el.nodeName === '#comment' && slots[el.type]) {
            var args = [i + 1, 0].concat(slots[el.type])
            vtree.splice.apply(vtree, args)
            i += slots[el.type].length
        } else if (el.children) {
            insertSlots(el.children, slots)
        }
    }
}

function collectSlots(node, soleSlot) {
    var slots = {}
    if (soleSlot) {
        slots[soleSlot] = node.children
        slots.__sole__ = soleSlot
    } else {
        node.children.forEach(function (el, i) {
            var name = el.props && el.props.slot
            if (el.forExpr) {
                slots[name] = node.children.slice(i, i + 2)
            } else {
                if (Array.isArray(slots[name])) {
                    slots[name].push(el)
                } else {
                    slots[name] = [el]
                }
            }
        })
    }
    return slots
}


//必须以字母开头,结尾以字母或数字结束,中间至少出现一次"-",
//并且不能大写字母,特殊符号,"_","$",汉字
var rcustomTag = /^[a-z]([a-z\d]+\-)+[a-z\d]+$/

function isCustomTag(type) {
    return rcustomTag.test(type) || avalon.components[type]
}

function mixinHooks(target, option, overwrite) {
    for (var k in option) {
        var v = option[k]
        //如果是生命周期钩子,总是不断收集
        if (componentEvents[k]) {
            if (k in target) {
                target[k].push(v)
            } else {
                target[k] = [option[k]]
            }
        } else {
            if (overwrite) {
                target[k] = v
            }
        }
    }
}