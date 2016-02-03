
var eventFilters = {
    stop: function (e) {
        e.stopPropagation()
        return e
    },
    prevent: function (e) {
        e.preventDefault()
        return e
    }
}
var keyCode = {
    esc: 27,
    tab: 9,
    enter: 13,
    space: 32,
    del: 46,
    up: 38,
    left: 37,
    right: 39,
    down: 40
}

avalon.each(keyCode, function (name, keyCode) {
    eventFilters[name] = function (e) {
        if (e.which !== keyCode) {
            e.$return = true
        }
        return e
    }
})

module.exports = eventFilters