avalon.directive("css", {
    init: directives.attr.init,
    update: function (val) {
        avalon(this.element).css(this.param, val)
    }
})
