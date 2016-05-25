var parseView = require('../strategy/parser/parseView')
var update = require('./_update')

avalon.important = function (elem, vid) {
    //如果vmodel还不存在,直接返回
    var wid = elem.props.wid
    var vm = avalon.vmodels[vid]
    if(!vm){
        return elem
    }else if (typeof avalon.caches[wid] === 'string') {
        var body = avalon.caches[wid] 
        //生成模板函数,并进行相关缓存
        body = '__vmodel__ =  avalon.vmodels[' +
                avalon.quote(vid) + ']\n' + body
        var render = Function('__vmodel__', body)
        var child = render()
        elem = avalon.caches[wid] = child[0]
        elem.order = 'ms-important'
        elem.skipAttrs = false
        elem.props['ms-important'] = vid
        elem.render = render
        return elem
    } else {
        elem = avalon.caches[wid]
        elem.skipAttrs = elem.skipContent = true
        return elem
    }
}
avalon.directive('important', {
    priority: 1,
    parse: function (binding, num, elem) {
        delete elem.props['ms-important']
        var wid = elem.props.wid || (elem.props.wid = avalon.makeHashCode('w'))
        var fn = parseView([elem], num) + '\n\nreturn vnodes' + num
        //将渲染函数的某一部分存起来,渲在c方法中转换为函数
        avalon.caches[wid] = fn
        elem.isVoidTag = true
        return ['vnode' + num + '.props.wid = ' + avalon.quote(wid),
            'vnode' + num + ' = avalon.important(vnode' + num + ',' +
                    avalon.quote(binding.expr) + ')'].join('\n') + '\n'

    },
    diff: function (cur, pre, steps, name) {
        if (pre.props[name] !== cur.props[name]) {
            update(cur, this.update, steps, 'important' )
        }
    },
    update: function (node, vnode) {
        var vid = vnode.props['ms-important']
        var vm = avalon.vmodels[vid]
        vm.$render = vnode.render
        vm.$element = node
    }
})

