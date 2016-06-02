var disposeDetectStrategy = require('../component/dispose.modern')
var patch = require('../strategy/patch')
var update = require('./_update')

//插入点机制,组件的模板中有一些slot元素,用于等待被外面的元素替代
var dir = avalon.directive('widget', {
    priority: 4,
    parse: function (cur, pre, binding) {
        var wid =  avalon.makeHashCode('w')
        avalon.resolvedComponents[wid] = {
            props: avalon.shadowCopy({}, pre.props),
            template: pre.template,
        }
        cur.props.wid = wid
        cur.template = pre.template
        cur.children = '[]'
        cur.props[binding.name] = avalon.parseExpr(binding)
        var old = pre.$append || ''
        pre.$append = [
                'var curIndex = vnodes.length - 1',
                'var el = vnodes[curIndex]',
                'var docker =  avalon.component(el, __vmodel__)' ,
                'if(docker && docker.render){' ,
                'try{eval("avalon.renderComponent( " + docker.render +",vnodes, curIndex)")}catch(e){console.log(e)}',
                '}'
        ].join('\n ') + old
    },
    define: function () {
        return avalon.mediatorFactory.apply(this, arguments)
    },
    diff: function (cur, pre, steps) {
        var coms = avalon.resolvedComponents
        var wid = cur.props.wid
        var docker = coms[wid]
        if (!docker || !docker.renderCount) {
            steps.count += 1
            cur.change = [this.replaceByComment]
        } else if (docker.renderCount && docker.renderCount < 2) {
            cur.steps = steps
            //https://github.com/RubyLouvre/avalon/issues/1390
            //当第一次渲染组件时,当组件的儿子为元素,而xmp容器里面只有文本时,就会出错
            pre.children = []
            fixRepeatAction(cur.children)
            update(cur, this.replaceByComponent, steps, 'widget')

            function fireReady(dom, vnode) {
                cur.vmodel.$fire('onReady', {
                    type: 'ready',
                    target: dom,
                    wid: wid,
                    vmodel: vnode.vmodel
                })
                docker.renderCount = 2
            }
            update(cur, fireReady, steps, 'widget', 'afterChange')

        } else {
            var needUpdate = !cur.diff || cur.diff(cur, pre, steps)
            cur.skipContent = !needUpdate
            var viewChangeObservers = cur.vmodel.$events.onViewChange
            if (viewChangeObservers && viewChangeObservers.length) {
                steps.count += 1
                cur.afterChange = [function (dom, vnode) {
                        var preHTML = pre.outerHTML
                        var curHTML = cur.outerHTML ||
                                (cur.outerHTML = avalon.vdomAdaptor(cur, 'toHTML'))
                        if (preHTML !== curHTML) {
                            cur.vmodel.$fire('onViewChange', {
                                type: 'viewchange',
                                target: dom,
                                wid: wid,
                                vmodel: vnode.vmodel
                            })
                        }
                        docker.renderCount++
                    }]
            }

        }
    },
    addDisposeMonitor: function (dom) {
        disposeDetectStrategy.byRewritePrototype(dom)
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
        node.ouerHTML = avalon.vdomAdaptor(node, 'toHTML')
        if (dom) {
            parent.replaceChild(com, dom)
        } else {
            parent.appendChild(com)
        }
        patch([com], [node], parent, node.steps)
        
        dir.addDisposeMonitor(com)
       
        return false
    }
})


function fixRepeatAction(nodes){
    for(var i = 0,el; el = nodes[i++];){
        if(el.directive === 'for'  ){
            el.fixAction = true
        }
        if(el.children){
            fixRepeatAction(el.children)
        }
    }
}