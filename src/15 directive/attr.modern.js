var bools = "autofocus,autoplay,async,allowTransparency,checked,controls,declare,disabled,defer,defaultChecked,defaultSelected" +
        "contentEditable,isMap,loop,multiple,noHref,noResize,noShade,open,readOnly,selected"
var boolMap = {}
bools.replace(rword, function(name) {
    boolMap[name.toLowerCase()] = name
})


var cacheTmpls = avalon.templateCache = {}

bindingHandlers.attr = function(data, vmodels) {
    var text = data.value.trim(),
            simple = true
    if (text.indexOf(openTag) > -1 && text.indexOf(closeTag) > 2) {
        simple = false
        if (rexpr.test(text) && RegExp.rightContext === "" && RegExp.leftContext === "") {
            simple = true
            text = RegExp.$1
        }
    }
    if (data.type === "include") {
        var elem = data.element
        data.includeRendered = getBindingCallback(elem, "data-include-rendered", vmodels)
        data.includeLoaded = getBindingCallback(elem, "data-include-loaded", vmodels)
        var outer = data.includeReplaced = !!avalon(elem).data("includeReplace")
        data.startInclude = DOC.createComment("ms-include")
        data.endInclude = DOC.createComment("ms-include-end")
        if (outer) {
            data.element = data.startInclude
            elem.parentNode.insertBefore(data.startInclude, elem)
            elem.parentNode.insertBefore(data.endInclude, elem.nextSibling)
        } else {
            elem.insertBefore(data.startInclude, elem.firstChild)
            elem.appendChild(data.endInclude)
        }
    }
    data.handlerName = "attr" //handleName用于处理多种绑定共用同一种bindingExecutor的情况
    parseExprProxy(text, vmodels, data, (simple ? 0 : scanExpr(data.value)))
}

bindingExecutors.attr = function(val, elem, data) {
    var method = data.type
    var attrName = data.param

    if (method === "css") {
        avalon(elem).css(attrName, val)
    } else if (method === "attr") {
        // ms-attr-class="xxx" vm.xxx="aaa bbb ccc"将元素的className设置为aaa bbb ccc
        // ms-attr-class="xxx" vm.xxx=false  清空元素的所有类名
        // ms-attr-name="yyy"  vm.yyy="ooo" 为元素设置name属性
        if (boolMap[attrName]) {
            var bool = boolMap[attrName]
            if (typeof elem[bool] === "boolean") {
                return elem[bool] = !!val
            }
        }
        var toRemove = (val === false) || (val === null) || (val === void 0)
        if (toRemove) {
            return elem.removeAttribute(attrName)
        }
        //SVG只能使用setAttribute(xxx, yyy), VML只能使用elem.xxx = yyy ,HTML的固有属性必须elem.xxx = yyy
        var isInnate = rsvg.test(elem) ? false : attrName in elem.cloneNode(false)
        if (isInnate) {
            elem[attrName] = val
        } else {
            elem.setAttribute(attrName, val)
        }

    } else if (method === "include" && val) {
        var vmodels = data.vmodels
        var rendered = data.includeRendered
        var loaded = data.includeLoaded
        var replace = data.includeReplaced
        var target = replace ? elem.parentNode : elem
        function scanTemplate(text) {
            if (loaded) {
                text = loaded.apply(target, [text].concat(vmodels))
            }
            if (rendered) {
                checkScan(target, function() {
                    rendered.call(target)
                }, NaN)
            }
            while (true) {
                var node = data.startInclude.nextSibling
                if (node && node !== data.endInclude) {
                    target.removeChild(node)
                } else {
                    break
                }
            }
            var dom = avalon.parseHTML(text)
            var nodes = avalon.slice(dom.childNodes)
            target.insertBefore(dom, data.endInclude)
            scanNodeArray(nodes, vmodels)
        }
        if (data.param === "src") {
            if (cacheTmpls[val]) {
                avalon.nextTick(function() {
                    scanTemplate(cacheTmpls[val])
                })
            } else {
                var xhr = new window.XMLHttpRequest
                xhr.onload = function() {
                    var s = xhr.status
                    if (s >= 200 && s < 300 || s === 304) {
                        scanTemplate(cacheTmpls[val] = xhr.responseText)
                    }
                }
                xhr.open("GET", val, true)
                xhr.withCredentials = true
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
                xhr.send(null)
            }
        } else {
            //IE系列与够新的标准浏览器支持通过ID取得元素（firefox14+）
            //http://tjvantoll.com/2012/07/19/dom-element-references-as-global-variables/
            var el = val && val.nodeType == 1 ? val : DOC.getElementById(val)
            avalon.nextTick(function() {
                scanTemplate(el.value || el.innerText || el.innerHTML)
            })
        }
    } else {
        elem[method] = val
        if (window.chrome && elem.tagName === "EMBED") {
            var parent = elem.parentNode//#525  chrome1-37下embed标签动态设置src不能发生请求
            var comment = document.createComment("ms-src")
            parent.replaceChild(comment, elem)
            parent.replaceChild(elem, comment)
        }
    }
}
//这几个指令都可以使用插值表达式，如ms-src="aaa/{{b}}/{{c}}.html"ms-src
"title,alt,src,value,css,include,href".replace(rword, function(name) {
    bindingHandlers[name] = bindingHandlers.attr
})