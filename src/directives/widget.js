

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
        var wid = avalon.makeHashCode('w')
        avalon.resolvedComponents[wid] = {
            props: avalon.shadowCopy({}, elem.props),
            template: elem.template
        }
        return  'vnode' + num + '.props.wid = "' + wid + '"\n' +
                'vnode' + num + '.props["ms-widget"] = ' + wrap(avalon.parseExpr(binding), 'widget') + ';\n' +
                '\tvnode' + num + ' = avalon.component(vnode' + num + ', __vmodel__)\n'
    },
    define: function (topVm, defaults, options) {
        var after = avalon.mix({}, defaults, options)
        var events = {}
        //绑定生命周期的回调
        'onInit onRready onViewChange onDispose'.replace(/\S+/g, function (a) {
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
        var renderCount = cur.renderCount
        if (!renderCount) {
            cur.change = [this.replaceByComment]
        } else if (renderCount === 1) {
            avalon.diff(cur.children, [])
            cur.change = [this.replaceByComponent]
            cur.afterChange = [
                function (dom, vnode) {
                    cur.vmodel.$fire('onReady', dom, vnode)
                }
            ]
        } else {
            var needUpdate = !cur.$diff || cur.$diff(cur, pre)
            cur.skipContent = !needUpdate

            var viewChangeObservers = cur.vmodel.$events.onViewChange
            if (viewChangeObservers && viewChangeObservers.length) {
                cur.change = cur.change || []
                var isChange = false
                cur.change.push(function (dom, vnode) {
                    if (checkChildrenChange(vnode)) {
                        isChange = true
                    }
                })
                cur.afterChange = [function (dom) {
                        isChange && cur.vmodel.$fire('onViewChange', dom)
                    }]
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
        var com = avalon.vdomAdaptor(node, 'toDOM')
        if (dom) {
            parent.replaceChild(com, dom)
        } else {
            parent.appendChild(com)
        }
    }
})
function checkChange(elem) {

}
function checkChildrenChange(elem) {
    for (var i = 0, el; el = elem.children[i++]; ) {
        if (el.change && el.change.length || el.afterChange && el.afterChange) {
            return true
        }
        if (el.children) {
            if (checkChildrenChange(el)) {
                return true
            }
        }
    }
    return false
}

// http://www.besteric.com/2014/11/16/build-blog-mirror-site-on-gitcafe/