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

function attrUpdate(node, vnode) {
    var attrs = vnode.changeAttrs
    if (!node || node.nodeType !== 1 || vnode.disposed) {
        return
    }
    if (attrs) {
        for (var attrName in attrs) {
            var val = attrs[attrName]
            // switch
            if (attrName === "href" || attrName === "src") {
                if (!root.hasAttribute) {
                    val = String(val).replace(/&amp;/g, "&") //处理IE67自动转义的问题
                }
                node[attrName] = val
                if (window.chrome && node.tagName === "EMBED") {
                    var parent = node.parentNode //#525  chrome1-37下embed标签动态设置src不能发生请求
                    var comment = document.createComment("ms-src")
                    parent.replaceChild(comment, node)
                    parent.replaceChild(node, comment)
                }
            } else if (attrName.indexOf("data-") === 0) {
                node.setAttribute(attrName, val)

            } else {
                var bool = boolMap[attrName]
                if (typeof node[bool] === "boolean") {
                    node[bool] = !!val
                    //布尔属性必须使用el.xxx = true|false方式设值
                    //如果为false, IE全系列下相当于setAttribute(xxx,''),
                    //会影响到样式,需要进一步处理
                }
                if (!W3C && propMap[attrName]) { //旧式IE下需要进行名字映射
                    attrName = propMap[attrName]
                }
                if (val === false) {
                    node.removeAttribute(attrName)
                    continue
                }
                //SVG只能使用setAttribute(xxx, yyy), VML只能使用node.xxx = yyy ,
                //HTML的固有属性必须node.xxx = yyy
                var isInnate = rsvg.test(node) ? false :
                        (DOC.namespaces && isVML(node)) ? true :
                        attrName in node.cloneNode(false)
                if (isInnate) {
                    node[attrName] = val + ""
                } else {
                    node.setAttribute(attrName, val)
                }

            }

        }
        delete vnode.changeAttrs
    }
}