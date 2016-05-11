
var scriptNode = avalon.document.createElement('script')
var scriptTypes = avalon.oneObject(['', 'text/javascript', 'text/ecmascript',
    'application/ecmascript', 'application/javascript'])

function fixScript(wrapper) {
    var els = typeof  wrapper.querySelectorAll !== 'undefined'?
       wrapper.querySelectorAll('script'): wrapper.getElementsByTagName('script')
    if (els.length) {
        for (var i = 0, el; el = els[i++]; ) {
            if (scriptTypes[el.type]) {
                //以偷龙转凤方式恢复执行脚本功能
                var neo = scriptNode.cloneNode(false) //FF不能省略参数
                Array.prototype.forEach.call(el.attributes, function (attr) {
                    if (attr && attr.specified) {
                        neo[attr.name] = attr.value //复制其属性
                        neo.setAttribute(attr.name, attr.value)
                    }
                }) // jshint ignore:line
                neo.text = el.text
                el.parentNode.replaceChild(neo, el) //替换节点
            }
        }
    }
}

module.exports = fixScript
