
var rnoscripts = /<noscript.*?>(?:[\s\S]+?)<\/noscript>/img
var rnoscriptText = /<noscript.*?>([\s\S]+?)<\/noscript>/im

var getXHR = function () {
    return new (window.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP") // jshint ignore:line
}
//将所有远程加载的模板,以字符串形式存放到这里
var templatePool = avalon.templateCache = {}

avalon.directive("include", {
    init: function (binding) {
        var elem = binding.element
        var vmodel = binding.vmodel
        var loaded = getBindingValue(elem, "data-include-loaded", vmodel)
        binding.loaded = typeof loaded === "function" ? loaded : noop
        var rendered = getBindingValue(elem, "data-include-rendered", vmodel)
        binding.rendered = typeof rendered === "function" ? rendered : noop


        binding.expr = normalizeExpr(binding.expr.trim())
        disposeVirtual(elem.children)
    },
    change: function (id, binding) {
        // var elem = binding.element
        addHooks(this, binding)
        if (binding.param === "src") {
            if (typeof templatePool[id] === "string") {
                scanTemplate(binding, templatePool[id], id)
            } else if (Array.isArray(templatePool[id])) { //#805 防止在循环绑定中发出许多相同的请求
                templatePool[id].push(binding)
            } else {
                var xhr = getXHR()
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        var s = xhr.status
                        if (s >= 200 && s < 300 || s === 304 || s === 1223) {
                            var text = xhr.responseText
                            var arr = templatePool[id]
                            templatePool[id] = text
                            for (var f = 0, data; data = arr[f++]; ) {
                                scanTemplate(data, text, id)
                            }

                        } else {
                            log("ms-include load [" + id + "] error")
                        }
                    }
                }
                templatePool[id] = [binding]
                xhr.open("GET", id, true)
                if ("withCredentials" in xhr) {
                    xhr.withCredentials = true
                }
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
                xhr.send(null)
            }
        } else {
            var el = document.getElementById(id)
            //IE系列与够新的标准浏览器支持通过ID取得元素（firefox14+）
            //http://tjvantoll.com/2012/07/19/dom-element-references-as-global-variables/
            if (el) {
                var text = el.tagName === "TEXTAREA" ? el.value :
                        el.tagName === "SCRIPT" ? el.text :
                        el.innerHTML
                scanTemplate(binding, text.trim(), "id:" + id)
            }
        }

    },
    update: function (elem, vnode, parent) {
        var first = elem.firstChild
        if (elem.childNodes.length !== 1 ||
                first.nodeType !== 1 ||
                !first.getAttribute("data-include-id")) {
            avalon.clearHTML(elem)
        }
    }
})


function scanTemplate(binding, template, id) {
    template = template.trim()
    var cache = binding.cache || (binding.cache = {})
    if (!cache[id]) {
        var nodes = createVirtual(template, true), throwError
        if (nodes.length !== 1) {
            throwError = true
        } else {
            updateVirtual(nodes, binding.vmodel)
            if (nodes.length !== 1 || getVType(nodes[0]) !== 1) {
                throwError = true
            }
        }
        if (throwError) {
            throw "ms-include加载的内容必须用一个元素包元素"
        }
        binding.cache[id] = nodes[0]
        nodes[0].props["data-include-id"] = id
    }
    var vnode = binding.element
    vnode.children.pop()
    vnode.children.push(binding.cache[id])
    addHooks(vnode, "change", function (elem) {
        binding.loaded(elem.firstChild)
    }, 1051)
    addHooks(vnode, "change", updateTemplate, 1052)
    addHooks(vnode, "afterchange", function (elem) {
        binding.rendered(elem.firstChild)
    }, 1053)
    batchUpdateEntity(binding.vmodel)
}

function updateTemplate(elem, vnode) {
    var vdom = vnode.children[0]
    var id = vdom.props["data-include-id"]
    var cache = elem.cache || (elem.cache = {})
    if (!cache[id]) {
        cache[id] = vdom.toDOM()
    }
    var target = elem.firstChild
    if (!target) {
        elem.appendChild(cache[id])
    } else if (target.getAttribute("data-include-id") !== id) {
        elem.replaceChild(cache[id], target)
    }
}