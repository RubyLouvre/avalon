var rnoscripts = /<noscript.*?>(?:[\s\S]+?)<\/noscript>/img
var rnoscriptText = /<noscript.*?>([\s\S]+?)<\/noscript>/im

var getXHR = function () {
    return new window.XMLHttpRequest() // jshint ignore:line
}
//将所有远程加载的模板,以字符串形式存放到这里
var templatePool = avalon.templateCache = {}

function getTemplateContainer(binding, id, text) {
    var div = binding.templateCache && binding.templateCache[id]
    if (div) {
        var dom = DOC.createDocumentFragment(),
                firstChild
        while (firstChild = div.firstChild) {
            dom.appendChild(firstChild)
        }
        return dom
    }
    return avalon.parseHTML(text)

}
function nodesToFrag(nodes) {
    var frag = DOC.createDocumentFragment()
    for (var i = 0, len = nodes.length; i < len; i++) {
        frag.appendChild(nodes[i])
    }
    return frag
}
avalon.directive("include", {
    init: directives.attr.init,
    update: function (val) {
        var binding = this
        var elem = this.element
        var vmodels = binding.vmodels
        var rendered = binding.includeRendered
        var effectClass = binding.effectName && binding.effectClass // 是否开启动画
        var templateCache = binding.templateCache // 是否data-include-cache
        var outer = binding.includeReplace // 是否data-include-replace
        var loaded = binding.includeLoaded
        var target = outer ? elem.parentNode : elem
        var _ele = binding._element // data-include-replace binding.element === binding.end

        binding.recoverNodes = binding.recoverNodes || avalon.noop

        var scanTemplate = function (text) {
            var _stamp = binding._stamp = +(new Date()) // 过滤掉频繁操作
            if (loaded) {
                var newText = loaded.apply(target, [text].concat(vmodels))
                if (typeof newText === "string")
                    text = newText
            }
            if (rendered) {
                checkScan(target, function () {
                    rendered.call(target)
                }, NaN)
            }
            var lastID = binding.includeLastID || "_default" // 默认

            binding.includeLastID = val
            var leaveEl = templateCache && templateCache[lastID] || DOC.createElement(elem.tagName || binding._element.tagName) // 创建一个离场元素

            if (effectClass) {
                leaveEl.className = effectClass
                target.insertBefore(leaveEl, binding.start) // 插入到start之前，防止被错误的移动
            }

            // cache or animate，移动节点
            (templateCache || {})[lastID] = leaveEl
            var fragOnDom = binding.recoverNodes() // 恢复动画中的节点
            if (fragOnDom) {
                target.insertBefore(fragOnDom, binding.end)
            }
            while (true) {
                var node = binding.start.nextSibling
                if (node && node !== leaveEl && node !== binding.end) {
                    leaveEl.appendChild(node)
                } else {
                    break
                }
            }

            // 元素退场
            avalon.effect.remove(leaveEl, target, function () {
                if (templateCache) { // write cache
                    if (_stamp === binding._stamp)
                        ifGroup.appendChild(leaveEl)
                }
            }, binding)


            var enterEl = target,
                    before = avalon.noop,
                    after = avalon.noop

            var fragment = getTemplateContainer(binding, val, text)
            var nodes = avalon.slice(fragment.childNodes)

            if (outer && effectClass) {
                enterEl = _ele
                enterEl.innerHTML = "" // 清空
                enterEl.setAttribute("ms-skip", "true")
                target.insertBefore(enterEl, binding.end.nextSibling) // 插入到bingding.end之后避免被错误的移动
                before = function () {
                    enterEl.insertBefore(fragment, null) // 插入节点
                }
                after = function () {
                    binding.recoverNodes = avalon.noop
                    if (_stamp === binding._stamp) {
                        fragment = nodesToFrag(nodes)
                        target.insertBefore(fragment, binding.end) // 插入真实element
                        scanNodeArray(nodes, vmodels)
                    }
                    if (enterEl.parentNode === target)
                        target.removeChild(enterEl) // 移除入场动画元素
                }
                binding.recoverNodes = function () {
                    binding.recoverNodes = avalon.noop
                    return nodesToFrag(nodes)
                }
            } else {
                before = function () {//新添加元素的动画
                    target.insertBefore(fragment, binding.end)
                    scanNodeArray(nodes, vmodels)
                }
            }

            avalon.effect.apply(enterEl, "enter", before, after)

        }


        if (binding.param === "src") {
            if (typeof templatePool[val] === "string") {
                avalon.nextTick(function () {
                    scanTemplate(templatePool[val])
                })
            } else if (Array.isArray(templatePool[val])) { //#805 防止在循环绑定中发出许多相同的请求
                templatePool[val].push(scanTemplate)
            } else {
                var xhr = getXHR()
                xhr.onload = function () {
                    var text = xhr.responseText
                    for (var f = 0, fn; fn = templatePool[val][f++]; ) {
                        fn(text)
                    }
                    templatePool[val] = text
                }
                xhr.onerror = function () {
                    log("ms-include load [" + val + "] error")
                }
                templatePool[val] = [scanTemplate]
                xhr.open("GET", val, true)
                if ("withCredentials" in xhr) {
                    xhr.withCredentials = true
                }
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
                xhr.send(null)
            }
        } else {
            //IE系列与够新的标准浏览器支持通过ID取得元素（firefox14+）
            //http://tjvantoll.com/2012/07/19/dom-element-references-as-global-variables/
            var el = val && val.nodeType === 1 ? val : DOC.getElementById(val)
            if (el) {
                avalon.nextTick(function () {
                    scanTemplate(el.value || el.innerText || el.innerHTML)
                })
            }
        }
    }
})
