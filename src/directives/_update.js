module.exports = function (vdom, update, steps,  type, hookName) {
    var dom = vdom.dom
    console.log(vdom, dom,'!!!!')
    update(vdom.dom, vdom, dom && dom.parentNode)
}
