avalon.directive("data", {
    priority: 100,
    update: function (val) {
        var elem = this.element
        var key = "data-" + this.param
        if (val && typeof val === "object") {
            elem[key] = val
        } else {
            elem.setAttribute(key, String(val))
        }
    }
})
