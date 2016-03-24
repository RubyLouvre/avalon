

//插入点机制,组件的模板中有一些ms-slot元素,用于等待被外面的元素替代
function wrap(str) {
    return str.replace('return __value__', function (a) {
        var prefix = 'if(Array.isArray(__value__)){\n' +
                '    __value__ = avalon.mix.apply({},__value__)\n' +
                '}\n'
        return prefix + a
    })
}

avalon.directive('com', {
    parse: function (binding, num, elem) {
        return  'vnode' + num + '.props.wid = ' + avalon.quote(avalon.makeHashCode('w')) + '\n' +
                'vnode' + num + '.props["ms-widget"] = ' + wrap(avalon.parseExpr(binding), 'widget') + ';\n' +
                //  'vnode' + num + '.props["widget"] = ' + avalon.quote(binding.expr) + ';\n' +
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
        if (cur.type !== pre.type) {
            //如果组件没有定义或ready,会返回注释节点
            if (cur.type === "#comment") {
                cur.change = [this.replaceByComment]
            } else {
                avalon.diff([cur], [])
                cur.change = [this.replaceByComponent]
            }
        } else {
            if (!pre.props.wid) {
                avalon.diff([cur], [])
                cur.change = [this.replaceByComponent]
            } else {
                cur.change = [this.update]
            }
        }
    },
    replaceByComment: function (dom, node, parent) {
        var comment = document.createComment(node.nodeValue)
        if (dom) {
            parent.replaceChild(comment, dom)
        } else {
            parent.appendChild(comment)
        }
    },
    replaceByComponent: function (dom, node, parent) {
        document.createElement(node.type)
        var com = avalon.vdomAdaptor(node).toDOM()
        if (dom) {
            parent.replaceChild(com, dom)
        } else {
            parent.appendChild(com)
        }
    },
    update: function (dom, node, parent) {
       console.log("=====")
    }
})


// http://www.besteric.com/2014/11/16/build-blog-mirror-site-on-gitcafe/