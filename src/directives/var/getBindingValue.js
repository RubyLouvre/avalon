var getBindingValue = function (elem, name, vmodel) {
    var callback = elem.props ? elem.props[name] : elem.getAttribute(name)
    if (callback) {
        if (vmodel.hasOwnProperty(callback) &&
                typeof vmodel[callback] === "function") {
            return vmodel[callback]
        }
    }
}

module.exports = getBindingValue
