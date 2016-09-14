module.exports = initComponent

var skipArray = require('../../vmodel/parts/skipArray')
var legalTags = {wbr: 1, xmp: 1, template: 1}
var rprops = /__vmodel__\.([\$\w\_]+)/g
var componentEvents = {onInit: 1, onReady: 1, onViewChange: 1, onDispose: 1}
var onceWarn = true

function initComponent(copy, data) {
    var tag = copy.nodeName
    var is = copy.props.is
    var template = copy.template
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
    var templateID = 'temp:' + template
    if (!avalon.caches[templateID]) {
        var shell = avalon.lexer(template)
        avalon.variant(shell)
        shell[0].props.is = is
        avalon.caches[templateID] = avalon.render(shell, copy.local)
    }

    //生成内部的渲染函数
    if (!definition.render) {
        var vtree = avalon.lexer(definition.template.trim())
        if (vtree.length > 1) {
            avalon.error('组件必须用一个元素包起来')
        }
        var soleSlot = definition.soleSlot
        replaceSlot(vtree, soleSlot)
        avalon.variant(vtree)
        definition.render = avalon.render(vtree)
    }

    var slotRender = avalon.caches[templateID]
    var defineRender = definition.render

    var hooks = {}//收集生命周期钩子
    for (var i in componentEvents) {
        hooks[i] = []
        var fn = data[i]
        if (typeof fn === 'function') {
            hooks[i].push(fn)
        }
        delete data[i]
    }
    var defaults = avalon.mix(true, {}, definition.defaults)
    for (var i in componentEvents) {
        var fn = defaults[i]
        if (typeof fn === 'function') {
            hooks[i].push(fn)
        }
        delete defaults[i]
    }
    var topVm = copy.vmodel.$model
    delete data.is
    delete data.id
    for (var i in defaults) {
        if (!(i in data)) {
            if (!skipArray[i]) {
                data[i] = defaults[i]
            }
        }
    }
    slotRender.replace(rprops, function (_, prop) {
        if (!(prop in data)) {
            data[prop] = topVm[prop]
        }
    })
    //得到组件在顶层vm的配置对象名
    var id = hooks.id || hooks.$id
    if (!id) {
        if (onceWarn) {
            avalon.warn('warning!', is, '组件最好在ms-widget配置对象中指定全局不重复的$id以提高性能!\n',
                    '若在ms-for循环中可以利用 ($index,el) in @array 中的$index拼写你的$id\n',
                    '如 ms-widget="{is:\'ms-button\',id:\'btn\'+$index}"'
                    )
            onceWarn = false
        }
        id = copy.props.wid || 'w' + (new Date - 0)
    }

    data.$id = id

    var vm = avalon.define(data)

    //绑定组件的生命周期钩子
    for (var e in componentEvents) {
        hooks[e].forEach(function (fn) {
            vm.$watch(e, fn)
        })
    }
    // 生成外部的渲染函数
    // template保存着最原始的组件容器信息
    // 我们先将它转换成虚拟DOM,如果是xmp, template,
    // 它们内部是一个纯文本节点, 需要继续转换为虚拟DOM

    function comRender(vmodel, local) {
        var shell = slotRender(vmodel, local)
        var shellRoot = shell[0]
        var vtree = defineRender(vmodel, local);
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
    vmodel.$render = comRender
    return  vm
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
