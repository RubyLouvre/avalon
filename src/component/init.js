var skipArray = require('../vmodel/parts/skipArray')

var legalTags = {wbr: 1, xmp: 1, template: 1}
var events = 'onInit,onReady,onViewChange,onDispose'
var componentEvents = avalon.oneObject(events)
var immunity = events.split(',').concat('is', 'define')
var onceWarn = true
function initComponent(src, copy, is) {
    var tag = src.type
    //判定用户传入的标签名是否符合规格
    if (!legalTags[tag] && !isCustomTag(tag)) {
        avalon.warn(tag + '不合适做组件的标签')
        return
    }
    //开始初始化组件
    var hooks = {}
    //用户只能操作顶层VM
    //只有$id,is的对象就是emptyOption
    var rawOption = copy['ms-widget']
    var isEmpty = false
    if (!rawOption) {
        isEmpty = true
        options = []
    } else {
        var options = [].concat(rawOption)
        options.forEach(function (a) {
            if (a && typeof a === 'object') {
                mixinHooks(hooks, (a.$model || a), true)
            }
        })
        isEmpty = isEmptyOption(hooks)
    }
    var definition = avalon.components[is]
    //初始化组件失败,因为连组件的定义都没有加载
    if (!definition) {
        return
    }
    var skipProps = immunity.concat()
    //得到组件在顶层vm的配置对象名
    var configName = is.replace(/-/g, '_')

    var topVm = copy.vmodel
    try {//如果用户在ms-widget没定义东西那么从vm中取默认东西
        var vmOption = topVm[configName]
        if (isEmpty && vmOption && typeof vmOption === 'object') {
            hooks = {}
            options = [vmOption]
            mixinHooks(hooks, vmOption.$model || vmOption, true)
            skipProps.push(configName)
        }
    } catch (e) {
    }


    //将用户声明组件用的自定义标签(或xmp.template)的template转换成虚拟DOM
    if (legalTags[tag] && src.children[0]) {
        src.children = avalon.lexer(src.children[0].nodeValue)
    }
    src.isVoidTag = src.skipContent = 0
    var slots = collectSlots(src, definition.soleSlot)
    //开始构建组件的vm的配置对象

    var define = hooks.define
    define = define || avalon.directives.widget.define
    if (!hooks.$id && onceWarn) {
        avalon.warn('warning!', is, '组件最好在ms-widget配置对象中指定全局不重复的$id以提高性能!\n',
                '若在ms-for循环中可以利用 ($index,el) in @array 中的$index拼写你的$id\n',
                '如 ms-widget="{is:\'ms-button\',$id:\'btn\'+$index}"'
                )
        onceWarn = false
    }
    var $id = hooks.$id || src.wid

    var defaults = avalon.mix(true, {}, definition.defaults)

    for (var i in slots) {
        if (i !== '__sole__') {
            var html = toHTML(slots[i])
            if (/\S/.test(html)) {//如果soleSlot为空,那么就不用赋值了
                defaults[i] = html
            }
        }
    }

    mixinHooks(hooks, defaults, false)

    var vmodel = define.apply(function (a, b) {
        skipProps.forEach(function (k) {
            delete a[k]
            delete b[k]
        })
    }, [topVm, defaults].concat(options))

    if (!avalon.modern) {//增强对IE的兼容
        for (var i in vmodel) {
            if (!skipArray[i] && typeof vmodel[i] === 'function') {
                vmodel[i] = vmodel[i].bind(vmodel)
            }
        }
    }

    vmodel.$id = $id

    //开始构建组件的虚拟DOM
    var finalTemplate = definition.template.trim()
    if (typeof definition.getTemplate === 'function') {
        finalTemplate = definition.getTemplate(vmodel, finalTemplate)
    }

    var vtree = avalon.lexer(finalTemplate)
    if (vtree.length > 1) {
        avalon.error('组件必须用一个元素包起来')
    }

    var componentRoot = vtree[0]

    avalon.vmodels[$id] = vmodel

    //将用户标签中的属性合并到组件标签的属性里
    avalon.mix(componentRoot.props, src.props)
    delete componentRoot.props['ms-widget']
    componentRoot.props.wid = $id
    //抽取用户标签里带slot属性的元素,替换组件的虚拟DOM树中的slot元素

    if (!src.isVoidTag) {
        mergeSlots(vtree, slots)
    }
    avalon.speedUp(vtree)
    for (var e in componentEvents) {
        if (hooks[e]) {
            hooks[e].forEach(function (fn) {
                vmodel.$watch(e, fn)
            })
        }
    }
    var render = avalon.render(vtree, src.local)
    vmodel.$render = render
    src[is + '-vm'] = vmodel
    src[is + '-vtree'] = vtree
    return src.is = is

}
module.exports = initComponent


function isEmptyOption(opt) {
    for (var k in opt) {
        if (k === 'is' || k === '$id')
            continue
        return false
    }
    return true
}
function toHTML(a) {
    if (Array.isArray(a)) {
        return a.map(function (e) {
            return avalon.vdomAdaptor(e, 'toHTML')
        })
    }
    if (typeof a === 'string') {
        return a
    }
    return avalon.vdomAdaptor(a, 'toHTML')
}


function collectSlots(node, soleSlot) {
    var slots = {}
    if (soleSlot) {
        slots[soleSlot] = toHTML(node.children).join('')
        slots.__sole__ = soleSlot
    } else {
        node.children.forEach(function (el) {
            if (el.nodeType === 1) {
                var name = el.props.slot
                if (name) {
                    delete el.props.slot
                    if (Array.isArray(slots[name])) {
                        slots[name].push(el)
                    } else if (slots[name]) {
                        slots[name] = [slots[name], el]
                    } else {
                        slots[name] = el
                    }
                }
            }
        })
    }
    return slots
}

function mergeSlots(vtree, slots, parent) {
    for (var i = 0, node; node = vtree[i++]; ) {
        if (node.nodeType === 1) {
            if (node.type === 'slot') {
                var name = node.props.name || slots.__sole__
                if (!(name in slots)) {
                    avalon.error('slot name="', name, '"is undefined')
                }
                if (name === slots.__sole__) {
                    parent.children = []
                    parent.props['ms-html'] = '##' + slots.__sole__
                    break
                } else {
                    var s = slots[name]
                    vtree.splice.apply(vtree, [i - 1, 1].concat(s))
                }
            } else {
                mergeSlots(node.children, slots, node)
            }
        }
    }

    return vtree
}

//必须以字母开头,结尾以字母或数字结束,中间至少出现一次"-",
//并且不能大写字母,特殊符号,"_","$",汉字
var rcustomTag = /^[a-z]([a-z\d]+\-)+[a-z\d]+$/

function isCustomTag(type) {
    return rcustomTag.test(type)
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