var bools = ["autofocus,autoplay,async,allowTransparency,checked,controls",
    "declare,disabled,defer,defaultChecked,defaultSelected",
    "contentEditable,isMap,loop,multiple,noHref,noResize,noShade",
    "open,readOnly,selected"
].join(",")
var boolMap = {}
bools.replace(rword, function (name) {
    boolMap[name.toLowerCase()] = name
})

var propMap = { //属性名映射
    "accept-charset": "acceptCharset",
    "char": "ch",
    "charoff": "chOff",
    "class": "className",
    "for": "htmlFor",
    "http-equiv": "httpEquiv"
}

var anomaly = ["accessKey,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan",
    "dateTime,defaultValue,frameBorder,longDesc,maxLength,marginWidth,marginHeight",
    "rowSpan,tabIndex,useMap,vSpace,valueType,vAlign"
].join(",")
anomaly.replace(rword, function (name) {
    propMap[name.toLowerCase()] = name
})


var attrDir = avalon.directive("attr", {
    init: function (binding) {
        //{{aaa}} --> aaa
        //{{aaa}}/bbb.html --> (aaa) + "/bbb.html"
        binding.expr = normalizeExpr(binding.expr.trim())
        if (binding.type === "include") {
            var elem = binding.element
            effectBinding(elem, binding)
            binding.includeRendered = getBindingCallback(elem, "data-include-rendered", binding.vmodels)
            binding.includeLoaded = getBindingCallback(elem, "data-include-loaded", binding.vmodels)
            var outer = binding.includeReplace = !!avalon(elem).binding("includeReplace")
            if (avalon(elem).binding("includeCache")) {
                binding.templateCache = {}
            }
            binding.start = DOC.createComment("ms-include")
            binding.end = DOC.createComment("ms-include-end")
            if (outer) {
                binding.element = binding.end
                binding._element = elem
                elem.parentNode.insertBefore(binding.end, elem)
                elem.parentNode.insertBefore(binding.end, elem.nextSibling)
            } else {
                elem.insertBefore(binding.start, elem.firstChild)
                elem.appendChild(binding.end)
            }
        }
    },
    update: function (val) {
        var elem = this.element
        var attrName = this.param
        if (attrName === "href" || attrName === "src") {
            elem[attrName] = val
            if (window.chrome && elem.tagName === "EMBED") {
                var parent = elem.parentNode //#525  chrome1-37下embed标签动态设置src不能发生请求
                var comment = document.createComment("ms-src")
                parent.replaceChild(comment, elem)
                parent.replaceChild(elem, comment)
            }
        } else {

            // ms-attr-class="xxx" vm.xxx="aaa bbb ccc"将元素的className设置为aaa bbb ccc
            // ms-attr-class="xxx" vm.xxx=false  清空元素的所有类名
            // ms-attr-name="yyy"  vm.yyy="ooo" 为元素设置name属性
            var toRemove = (val === false) || (val === null) || (val === void 0)
            if (!W3C && propMap[attrName]) { //旧式IE下需要进行名字映射
                attrName = propMap[attrName]
            }
            var bool = boolMap[attrName]
            if (typeof elem[bool] === "boolean") {
                elem[bool] = !!val //布尔属性必须使用el.xxx = true|false方式设值
                if (!val) { //如果为false, IE全系列下相当于setAttribute(xxx,''),会影响到样式,需要进一步处理
                    toRemove = true
                }
            }
            if (toRemove) {
                return elem.removeAttribute(attrName)
            }
            //SVG只能使用setAttribute(xxx, yyy), VML只能使用elem.xxx = yyy ,HTML的固有属性必须elem.xxx = yyy
            var isInnate = rsvg.test(elem) ? false : attrName in elem.cloneNode(false)
            if (isInnate) {
                elem[attrName] = val + ""
            } else {
                elem.setAttribute(attrName, val)
            }
        }
    }
})

//这几个指令都可以使用插值表达式，如ms-src="aaa/{{b}}/{{c}}.html"
"title,alt,src,value,css,include,href".replace(rword, function (name) {
    directives[name] = attrDir
})
