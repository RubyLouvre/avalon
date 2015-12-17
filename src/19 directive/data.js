avalon.directive("data", {
    priority: 100,
    init: noop,
    change: directives.attr.change
})
