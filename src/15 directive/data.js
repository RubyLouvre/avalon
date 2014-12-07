// bindingHandlers.data 定义在if.js
bindingExecutors.data = function(val, elem) {
    var key = "data-" + data.param
    if (val && typeof val === "object") {
        elem[key] = val
    } else {
        elem.setAttribute(key, String(val))
    }
}
