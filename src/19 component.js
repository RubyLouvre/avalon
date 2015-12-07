var componentQueue = []
var widgetList = []
var componentHooks = {
    $construct: function () {
        return avalon.mix.apply(null, arguments)
    },
    $ready: noop,
    $init: noop,
    $dispose: noop,
    $container: null,
    $childReady: noop,
    $replace: false,
    $extend: null,
    $$template: function (str) {
        return str
    }
}

avalon.components = {}
avalon.component = function (name, opts) {
    if (opts) {
        avalon.components[name] = avalon.mix({}, componentHooks, opts)
    }
    for (var i = 0, obj; obj = componentQueue[i]; i++) {
        if (name === obj.fullName) {
            componentQueue.splice(i, 1)
            i--;

            (function (host, hooks, elem, widget) {
                //如果elem已从Document里移除,直接返回
                //issuse : https://github.com/RubyLouvre/avalon2/issues/40
                if (!avalon.contains(DOC, elem) || elem.msResolved) {
                    avalon.Array.remove(componentQueue, host)
                    return
                }
  
                var dependencies = 1
                var library = host.library
                var global = avalon.libraries[library] || componentHooks

                //===========收集各种配置=======
                if (elem.getAttribute("ms-attr-identifier")) {
                    //如果还没有解析完,就延迟一下 #1155
                    return
                }
                var elemOpts = getOptionsFromTag(elem, host.vmodels)
                var vmOpts = getOptionsFromVM(host.vmodels, elemOpts.config || host.fullName)
                var $id = elemOpts.$id || elemOpts.identifier || generateID(widget)
                delete elemOpts.config
                delete elemOpts.$id
                delete elemOpts.identifier
                var componentDefinition = {}

                var parentHooks = avalon.components[hooks.$extend]
                if (parentHooks) {
                    avalon.mix(true, componentDefinition, parentHooks)
                    componentDefinition = parentHooks.$construct.call(elem, componentDefinition, {}, {})
                } else {
                    avalon.mix(true, componentDefinition, hooks)
                }
                componentDefinition = avalon.components[name].$construct.call(elem, componentDefinition, vmOpts, elemOpts)

                componentDefinition.$refs = {}
                componentDefinition.$id = $id

                //==========构建VM=========
                var keepSlot = componentDefinition.$slot
                var keepReplace = componentDefinition.$replace
                var keepContainer = componentDefinition.$container
                var keepTemplate = componentDefinition.$template
                delete componentDefinition.$slot
                delete componentDefinition.$replace
                delete componentDefinition.$container
                delete componentDefinition.$construct

                var vmodel = avalon.define(componentDefinition) || {}
                elem.msResolved = 1 //防止二进扫描此元素
                vmodel.$init(vmodel, elem)
                global.$init(vmodel, elem)
                var nodes = elem.childNodes
                //收集插入点
                var slots = {}, snode
                for (var s = 0, el; el = nodes[s++]; ) {
                    var type = el.nodeType === 1 && el.getAttribute("slot") || keepSlot
                    if (type) {
                        if (slots[type]) {
                            slots[type].push(el)
                        } else {
                            slots[type] = [el]
                        }
                    }
                }

                if (vmodel.$$template) {
                    avalon.clearHTML(elem)
                    elem.innerHTML = vmodel.$$template(keepTemplate)
                }
                for (s in slots) {
                    if (vmodel.hasOwnProperty(s)) {
                        var ss = slots[s]
                        if (ss.length) {
                            var fragment = avalonFragment.cloneNode(true)
                            for (var ns = 0; snode = ss[ns++]; ) {
                                fragment.appendChild(snode)
                            }
                            vmodel[s] = fragment
                        }
                        slots[s] = null
                    }
                }
                slots = null
                var child = elem.children[0] || elem.firstChild
                if (keepReplace) {
                    elem.parentNode.replaceChild(child, elem)
                    child.msResolved = 1
                    var cssText = elem.style.cssText
                    var className = elem.className
                    elem = host.element = child
                    elem.style.cssText += ";"+ cssText
                    if (className) {
                        avalon(elem).addClass(className)
                    }
                }
                if (keepContainer) {
                    keepContainer.appendChild(elem)
                }
                avalon.fireDom(elem, "datasetchanged",
                        {library: library, vm: vmodel, childReady: 1})
                var children = 0
                var removeFn = avalon.bind(elem, "datasetchanged", function (e) {
                    if (e.childReady && e.library === library) {
                        dependencies += e.childReady
                        if (vmodel !== e.vm) {
                            vmodel.$refs[e.vm.$id] = e.vm
                            if (e.childReady === -1) {
                                children++
                                vmodel.$childReady(vmodel, elem, e)
                            }
                            e.stopPropagation()
                        }
                    }
                    if (dependencies === 0) {
                        var id1 = setTimeout(function () {
                            clearTimeout(id1)

                            vmodel.$ready(vmodel, elem, host.vmodels)
                            global.$ready(vmodel, elem, host.vmodels)
                        }, children ? Math.max(children * 17, 100) : 17)
                        avalon.unbind(elem, "datasetchanged", removeFn)
                        //==================
                        host.rollback = function () {
                            try {
                                vmodel.$dispose(vmodel, elem)
                                global.$dispose(vmodel, elem)
                            } catch (e) {
                            }
                            delete avalon.vmodels[vmodel.$id]
                        }
                        injectDisposeQueue(host, widgetList)
                        if (window.chrome) {
                            elem.addEventListener("DOMNodeRemovedFromDocument", function () {
                                setTimeout(rejectDisposeQueue)
                            })
                        }

                    }
                })
                scanTag(elem, [vmodel].concat(host.vmodels))
                avalon.vmodels[vmodel.$id] = vmodel
                if (!elem.childNodes.length) {
                    avalon.fireDom(elem, "datasetchanged", {library: library, vm: vmodel, childReady: -1})
                } else {
                    var id2 = setTimeout(function () {
                        clearTimeout(id2)
                        avalon.fireDom(elem, "datasetchanged", {library: library, vm: vmodel, childReady: -1})
                    }, 17)
                }

            })(obj, avalon.components[name], obj.element, obj.widget)// jshint ignore:line

        }
    }
}


function getOptionsFromVM(vmodels, pre) {
    if (pre) {
        for (var i = 0, v; v = vmodels[i++]; ) {
            if (v.hasOwnProperty(pre) && typeof v[pre] === "object") {
                var vmOptions = v[pre]
                return vmOptions.$model || vmOptions
                break
            }
        }
    }
    return {}
}

avalon.libraries = []
avalon.library = function (name, opts) {
    if (DOC.namespaces) {
        DOC.namespaces.add(name, 'http://www.w3.org/1999/xhtml');
    }
    avalon.libraries[name] = avalon.mix({
        $init: noop,
        $ready: noop,
        $dispose: noop
    }, opts || {})
}

avalon.library("ms")

/*
 broswer  nodeName  scopeName  localName
 IE9     ONI:BUTTON oni        button
 IE10    ONI:BUTTON undefined  oni:button
 IE8     button     oni        undefined
 chrome  ONI:BUTTON undefined  oni:button
 
 */
function isWidget(el) { //如果为自定义标签,返回UI库的名字
    if (el.scopeName && el.scopeName !== "HTML") {
        return el.scopeName
    }
    var fullName = el.nodeName.toLowerCase()
    var index = fullName.indexOf(":")
    if (index > 0) {
        return fullName.slice(0, index)
    }
}
//各种MVVM框架在大型表格下的性能测试
// https://github.com/RubyLouvre/avalon/issues/859
