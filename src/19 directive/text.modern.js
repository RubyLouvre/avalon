avalon.directive("text", {
    update: function (val) {
        var elem = this.element
        val = val == null ? "" : val //不在页面上显示undefined null
        if (elem.nodeType === 3) { //绑定在文本节点上
            try { //IE对游离于DOM树外的节点赋值会报错
                elem.data = val
            } catch (e) {
            }
        } else { //绑定在特性节点上
            elem.textContent = val
        }
    }
})