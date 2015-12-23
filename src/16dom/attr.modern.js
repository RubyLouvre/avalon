var bools = ["autofocus,autoplay,async,allowTransparency,checked,controls",
    "declare,disabled,defer,defaultChecked,defaultSelected",
    "contentEditable,isMap,loop,multiple,noHref,noResize,noShade",
    "open,readOnly,selected"
].join(",")

var boolMap = {}
bools.replace(rword, function (name) {
    boolMap[name.toLowerCase()] = name
})

var propMap = {//不规则的属性名映射
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



function attrUpdate(elem, vnode) {
    var attrs = vnode.changeAttrs
    if (attrs) {
        for (var attrName in attrs) {
            var val = attrs[attrName]
            // switch
            if (attrName === "src" && window.chrome && elem.tagName === "EMBED") {
                elem[attrName] = val
                var parent = elem.parentNode //#525  chrome1-37下embed标签动态设置src不能发生请求
                var comment = document.createComment("ms-src")
                parent.replaceChild(comment, elem)
                parent.replaceChild(elem, comment)
            } else if (attrName.indexOf("data-") == 0) {
                elem.setAttribute(attrName, val)
            } else {
                var bool = boolMap[attrName]
                if (typeof elem[bool] === "boolean") {
                    //布尔属性必须使用el.xxx = true|false方式设值
                    //如果为false, IE全系列下相当于setAttribute(xxx,''),
                    //会影响到样式,需要进一步处理
                    elem[bool] = !!val
                }
                if (val === false) {
                    elem.removeAttribute(attrName)
                    continue
                }
                if (propMap[attrName]) { //旧式IE下需要进行名字映射
                    attrName = propMap[attrName]
                }
                //SVG只能使用setAttribute(xxx, yyy), VML只能使用elem.xxx = yyy ,
                //HTML的固有属性必须elem.xxx = yyy
                var isInnate = rsvg.test(elem) ? false : attrName in elem.cloneNode(false)
                if (isInnate) {
                    elem[attrName] = val + ""
                } else {
                    elem.setAttribute(attrName, val)
                }
            }
        }
    }
    delete vnode.changeAttrs
}
