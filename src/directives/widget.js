
var makeHashCode = avalon.makeHashCode

//插入点机制,组件的模板中有一些ms-slot元素,用于等待被外面的元素替代
function wrap(str) {
    return str.replace('return __value__', function (a) {
        var prefix = 'if(Array.isArray(__value__)){\n' +
                '    __value__ = avalon.mix.apply({},__value__)\n' +
                '}\n'
        return prefix + a
    })
}

avalon.directive('widget', {
    parse: function (binding, num, elem) {
        if (elem.skipContent || !elem.children.length) {
            elem.children = createVirtual(elem.template)
        }
    //    var uuid = makeHashCode('w')
    //    avalon.caches[uuid] = elem.children
     //   var component = 'config' + num
        return  'vnode' + num + '.props["ms-widget"] = ' + 
                wrap(avalon.parseExpr(binding), 'widget') + ';\n' +
               
                '\tvnode' + num + ' = avalon.component(vnode' + num + ', __vmodel__)\n' 
               

    },
    define: function (topVm, defaults, options) {
        var after = avalon.mix({}, defaults, options)
        var events = {}
        //绑定生命周期的回调
        '$init $ready $dispose'.replace(/\S+/g, function (a) {
            if (typeof after[a] === 'function')
                events[a] = after[a]
            delete after[a]
        })
        var vm = avalon.mediatorFactory(topVm, after)
        for (var i in events) {
            vm.$watch(i, events[i])
        }
        return vm
    },
    diff: function (cur, pre) {
        var a = cur.props.resolved
        var p = pre.props.resolved
        if (a && typeof a === 'object') {

        } else {
            cur.props['ms-widget'] = p
        }

    },
    update: function () {
    },
    replaceElement: function (dom, node, parent) {
        var el = avalon.vdomAdaptor(node).toDOM()
        if (dom) {
            parent.replaceChild(el, dom)
        } else {
            parent.appendChild(el)
        }
        avalon(el).addClass(node.props.wid)
        if (el.children.length) {
            updateEntity(el.childNodes, node.children, el)
        }

        return false
    },
    replaceContent: function () {
    },
    switchContent: function () {

    }
})


