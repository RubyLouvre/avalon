avalon.directive("text", {
    update: function (value) {
        var elem = this.element
        value = value == null ? "" : value //不在页面上显示undefined null
        if (elem.nodeType === 3) { //绑定在文本节点上
            try { //IE对游离于DOM树外的节点赋值会报错
                elem.data = value
            } catch (e) {
            }
        } else { //绑定在特性节点上
            if ("textContent" in elem) {
                elem.textContent = value
            } else {
                elem.innerText = value
            }
        }
    }
})