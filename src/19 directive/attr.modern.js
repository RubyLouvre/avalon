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
        var node = this.element
        var attrName = this.param
        //这模块在1.5.9被重构了
        if (attrName.indexOf('data-') === 0 || rsvg.test(node)) {
            node.setAttribute(attrName, val)
        } else {
            var propName = propMap[attrName] || attrName
            if (typeof node[propName] === 'boolean') {
                //布尔属性必须使用el.xxx = true|false方式设值
                //如果为false, IE全系列下相当于setAttribute(xxx,''),
                //会影响到样式,需要进一步处理
                node[propName] = !!val
            }
            if (val === false) {
                node.removeAttribute(attrName)
                return
            }

            //SVG只能使用setAttribute(xxx, yyy), VML只能使用node.xxx = yyy ,
            //HTML的固有属性必须node.xxx = yyy
            var isInnate = attrName in node.cloneNode(false)
            if (isInnate) {
                node[propName] = val + ''
            } else {
                node.setAttribute(attrName, val)
            }
        }

    }
})

//这几个指令都可以使用插值表达式，如ms-src="aaa/{{b}}/{{c}}.html"
"title,alt,src,value,css,include,href".replace(rword, function (name) {
    directives[name] = attrDir
})
