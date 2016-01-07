
var getXHR = function () {
    return new window.XMLHttpRequest() // jshint ignore:line
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
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        addHooks(this, binding)
        if (binding.param === "src") {
            if (typeof templatePool[id] === "string") {
                scanTemplate(binding, templatePool[id], id)
            } else if (Array.isArray(templatePool[id])) { //#805 防止在循环绑定中发出许多相同的请求
                templatePool[id].push(binding)
            } else {
                var xhr = getXHR()
                xhr.onload = function () {
                    var text = xhr.responseText
                    var arr = templatePool[id]
                    templatePool[id] = text
                    for (var f = 0, data; data = arr[f++]; ) {
                        scanTemplate(data, text, id)
                    }

                }
                templatePool[id] = [binding]
                xhr.onerror = function () {
                    log("ms-include load [" + id + "] error")
                }
                xhr.open("GET", id, true)
                if ("withCredentials" in xhr) {
                    xhr.withCredentials = true
                }
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
                xhr.send(null)
            }
        } else {
            var node = document.getElementById(id)
            if (node) {
                var text = node.tagName === "TEXTAREA" ? node.value :
                        node.tagName === "SCRIPT" ? node.text :
                        node.tagName === "NOSCRIPT" ? node.textContent :
                        node.innerHTML
                scanTemplate(binding, text.trim(), "id:" + id)
            }
        }

    },
    update: function (node) {
        var first = node.firstChild
        if (node.childNodes.length !== 1 ||
                first.nodeType !== 1 ||
                !first.getAttribute("data-include-id")) {
            avalon.clearHTML(node)
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
    addHook(vnode, function (elem) {
        binding.loaded(elem.firstChild)
    }, "change", 1051)
    addHook(vnode, updateTemplate, "change", 1052)
    addHook(vnode, function (elem) {
        binding.rendered(elem.firstChild)
    }, "afterChange", 1053)
    try{
    batchUpdateEntity(binding.vmodel.$id.split("??")[0])
    }catch(e){}
}

function updateTemplate(elem, vnode) {
    if (!vnode.disposed) {
        return
    }
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