module.exports = function (vdom, update,hookName) {
    var dom = vdom.dom
    update(vdom.dom, vdom, dom && dom.parentNode)
    if(hookName){
        vdom.afterChange = vdom.afterChange || []
        avalon.Array.ensure(vdom.afterChange, update)
    }
}
