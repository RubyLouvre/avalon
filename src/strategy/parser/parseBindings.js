var rneedQuote = /[W-]/
var quote = avalon.quote
var directives = avalon.directives
var rbinding = require('../../seed/regexp').binding
var eventMap = avalon.oneObject('animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit')
var keyMap = avalon.oneObject("break,case,catch,continue,debugger,default,delete,do,else,false," +
        "finally,for,function,if,in,instanceof,new,null,return,switch,this," +
        "throw,true,try,typeof,var,void,while,with," + /* 关键字*/
        "abstract,boolean,byte,char,class,const,double,enum,export,extends," +
        "final,float,goto,implements,import,int,interface,long,native," +
        "package,private,protected,public,short,static,super,synchronized," +
        "throws,transient,volatile")
function parseBindings(props, num, elem) {
    var bindings = []
    var skip = 'ms-skip' in props
    var ret = ''
    var uniq = {}
    for (var i in props) {
        var value = props[i], match

        if (!skip &&  (match = i.match(rbinding))) {
            var type = match[1]
            var param = match[2] || ''
            var name = i
            if (eventMap[type]) {
                var order = parseFloat(param) || 0
                param = type
                type = 'on'
            }
            name = 'ms-' + type + (param ? '-' + param : '')
            if (i !== name) {
                delete props[i]
                props[name] = value
            }
            if (directives[type]) {
                var binding = {
                    type: type,
                    param: param,
                    name: name,
                    expr: value,
                    priority: directives[type].priority || type.charCodeAt(0) * 100
                }
                if (type === 'on') {
                    order = order || 0
                    binding.name += '-' + order
                    binding.priority += param.charCodeAt(0) * 100 + order
                }
                if(!uniq[binding.name]){
                    uniq[binding.name] = 1
                    bindings.push(binding)
                }
            }
        } else {
            //IE6-8下关键字不能直接当做对象的键名，需要用引号括起来
            if (rneedQuote.test(i) || keyMap[i]) {//收集非绑定属性
                ret += 'vnode' + num + '.props[' + quote(i) + '] = ' + quote(value) + '\n'
            } else {
                ret += 'vnode' + num + '.props.' + i + ' = ' + quote(value) + '\n'
            }
        }
    }

    if (!bindings.length) {
        ret += '\tvnode' + num + '.skipAttrs = true\n'
    } else {
        bindings.sort(byPriority)
        ret += ('vnode' + num + '.order = "'+ bindings.map(function(a){
            return a.name
        }).join(';;')+'"\n')
        //优化处理ms-widget
        var first = bindings[0]
        var isWidget = first && first.type === 'widget'
        if (isWidget) {
            bindings.shift()
            bindings.forEach(function (binding) {
                ret += 'vnode' + num + '.props[' + quote(binding.name) + '] = ' + quote(binding.expr) + '\n'
            })
            ret += directives['widget'].parse(first, num, elem)
        } else {
            bindings.forEach(function (binding) {
                ret += directives[binding.type].parse(binding, num, elem)
            })
        }

    }
    return ret

}

function byPriority(a, b) {
    return a.priority - b.priority
}

module.exports = parseBindings