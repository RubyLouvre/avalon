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
    if (!legalTags[tag] && !isCustomTag(tag)) {
        avalon.warn(tag + '不合适做组件的标签')
        return
    }
    //开始初始化组件
    var hooks = {}
    //用户只能操作顶层VM
    //只有$id,is的对象就是emptyOption
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
    var definition = avalon.components[is]
    //如果连组件的定义都没有加载回来,应该立即返回 
    if (!definition) {
        return
    }
  

    //得到组件在顶层vm的配置对象名
    if (!hooks.$id && onceWarn) {
        avalon.warn('warning!', is, '组件最好在ms-widget配置对象中指定全局不重复的$id以提高性能!\n',
                '若在ms-for循环中可以利用 ($index,el) in @array 中的$index拼写你的$id\n',
                '如 ms-widget="{is:\'ms-button\',$id:\'btn\'+$index}"'
                )
        onceWarn = false
    }
    var define = hooks.define
    define = define || avalon.directives.widget.define
    //生成组件VM
    var $id = hooks.$id || src.props.wid || 'w' + (new Date - 0)
    var defaults = avalon.mix(true, {}, definition.defaults)
    mixinHooks( hooks, defaults, false)//src.vmodel,
    var skipProps = immunity.concat()
    function sweeper(a, b) {
        skipProps.forEach(function (k) {
            delete a[k]
            delete b[k]
        })
    }

    sweeper.isWidget = true
    var vmodel = define.apply(sweeper, [src.vmodel,defaults].concat(options))
    if (!avalon.modern) {//增强对IE的兼容
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
    var shell = avalon.lexer(template)
    var shellRoot = shell[0]
    var sc = shellRoot.children
    if (sc && sc.length === 1 && sc[0].nodeValue) {
        shellRoot.children = avalon.lexer(sc[0].nodeValue)
    }

    delete shellRoot.isVoidTag
    delete shellRoot.template
    delete shellRoot.skipContent
    delete shellRoot.props['ms-widget']
    shellRoot.nodeName = 'cheng7'
    shellRoot.children = shellRoot.children || []
    shellRoot.props.is = is
    shellRoot.props.wid = $id
    avalon.speedUp(shell)
    var render = avalon.render(shell, local)
    
    //生成内部的渲染函数
    var finalTemplate = definition.template.trim()
    if (typeof definition.getTemplate === 'function') {
        finalTemplate = definition.getTemplate(vmodel, finalTemplate)
    }
    var vtree = avalon.lexer(finalTemplate)

    if (vtree.length > 1) {
        avalon.error('组件必须用一个元素包起来')
    }
    var soleSlot = definition.soleSlot
    replaceSlot(vtree, soleSlot)
    avalon.speedUp(vtree)

    var render2 = avalon.render(vtree)

    //生成最终的组件渲染函数
    var str = fnTemplate + ''
    var zzzzz = soleSlot ? avalon.quote(soleSlot) : "null"
    str = str.
            replace('XXXXX', stringifyAnonymous(render)).
            replace('YYYYY', stringifyAnonymous(render2)).
            replace('ZZZZZ', zzzzz)

    var begin = str.indexOf('{') + 1
    var end = str.lastIndexOf("}")

    var lastFn = Function('vm', 'local', str.slice(begin, end))
    vmodel.$render = lastFn
    src['component-vm:' + is] = vmodel

    return  vmodel.$render = lastFn

}
module.exports = initComponent

function stringifyAnonymous(fn) {
    return fn.toString().replace('anonymous', '')
            .replace(/\s*\/\*\*\//g, '')
}


function fnTemplate() {
    var shell = (XXXXX)(vm, local);
    var shellRoot = shell[0]
    var vtree = (YYYYY)(vm, local);
    var component = vtree[0]

    //处理diff
    var orderUniq = {}
   
    String('ms-widget,'+shellRoot.order + ',' + component.order).
            replace(avalon.rword, function (a) {
                if (a !== 'undefined')
                    orderUniq[a] = a
            })

    shellRoot.order = Object.keys(orderUniq).join(',')

    for (var i in shellRoot) {
        if (i !== 'children' && i !== 'nodeName') {
            if (i === 'props') {
                avalon.mix(component.props, shellRoot.props)
            } else {
                component[i] = shellRoot[i]
            }
        }
    }


    var soleSlot = ZZZZZ
    var slots = avalon.collectSlots(shellRoot, soleSlot)
    if (soleSlot && (!slots[soleSlot] || !slots[soleSlot].length)) {
        slots[soleSlot] = [{
                nodeType: 3,
                nodeName: '#text',
                nodeValue: vm[soleSlot],
                dynamic: true
            }]
    }
    avalon.insertSlots(vtree, slots)

    delete component.skipAttrs
    delete component.skipContent
    return vtree

}

function replaceSlot(vtree, slotName) {
    for (var i = 0, el; el = vtree[i]; i++) {
        if (el.nodeName === 'slot') {
            vtree.splice(i, 1, {
                nodeName: '#comment',
                nodeValue: 'slot:' + (el.props.name || slotName),
                nodeType: 8,
                dynamic: (el.props.name || slotName)
            }, {
                nodeName: '#comment',
                nodeValue: 'slot-end:',
                nodeType: 8
            })
            i++
        } else if (el.nodeType === 1 && el.children) {
            replaceSlot(el.children, slotName)
        }
    }
}

avalon.insertSlots = function (vtree, slots) {
    for (var i = 0, el; el = vtree[i]; i++) {
        if (el.nodeType === 8 && slots[el.dynamic]) {
            var args = [i + 1, 0].concat(slots[el.dynamic])
            vtree.splice.apply(vtree, args)
            i += slots[el.dynamic].length
        } else if (el.nodeType === 1 && el.children) {
            avalon.insertSlots(el.children, slots)
        }
    }
}

avalon.collectSlots = function (node, soleSlot) {
    var slots = {}
    if (soleSlot) {
        slots[soleSlot] = node.children
        slots.__sole__ = soleSlot
    } else {
        node.children.forEach(function (el, i) {
            if (el.nodeType === 1) {
                var name = el.props.slot
                if (name) {
                    // delete el.props.slot
                    if (Array.isArray(slots[name])) {
                        slots[name].push(el)
                    } else {
                        slots[name] = [el]
                    }
                }
            } else if (el.dynamic === 'for' && /slot=['"](\w+)/.test(el.template)) {
                var a = RegExp.$1
                slots[a] = node.children.slice(i, i + 2)
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