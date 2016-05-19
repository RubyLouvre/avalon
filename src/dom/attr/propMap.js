var propMap = {//不规则的属性名映射
    'accept-charset': 'acceptCharset',
    'char': 'ch',
    charoff: 'chOff',
    'class': 'className',
    'for': 'htmlFor',
    'http-equiv': 'httpEquiv'
}
/*
contenteditable不是布尔属性
http://www.zhangxinxu.com/wordpress/2016/01/contenteditable-plaintext-only/
contenteditable=''
contenteditable='events'
contenteditable='caret'
contenteditable='plaintext-only'
contenteditable='true'
contenteditable='false'
 */
var bools = ['autofocus,autoplay,async,allowTransparency,checked,controls',
    'declare,disabled,defer,defaultChecked,defaultSelected,',
    'isMap,loop,multiple,noHref,noResize,noShade',
    'open,readOnly,selected'
].join(',')

bools.replace(/\w+/g, function (name) {
    propMap[name.toLowerCase()] = name
})

var anomaly = ['accessKey,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan',
    'dateTime,defaultValue,contentEditable,frameBorder,longDesc,maxLength,'+
    'marginWidth,marginHeight,rowSpan,tabIndex,useMap,vSpace,valueType,vAlign'
].join(',')

anomaly.replace(/\w+/g, function (name) {
    propMap[name.toLowerCase()] = name
})

module.exports = propMap
