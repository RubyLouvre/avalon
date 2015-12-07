var rdash = /\(([^)]*)\)/
var onDir = avalon.directive("on", {
    priority: 3000,
    init: function (binding) {
        var value = binding.expr
        binding.type = "on"
        var eventType = binding.param.replace(/-\d+$/, "") // ms-on-mousemove-10
        if (typeof onDir[eventType + "Hook"] === "function") {
            onDir[eventType + "Hook"](binding)
        }
        if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
            var matched = (value.match(rdash) || ["", ""])[1].trim()
            if (matched === "" || matched === "$event") { // aaa() aaa($event)当成aaa处理
                value = value.replace(rdash, "")
            }
        }
        binding.expr = value
    },
    update: function (callback) {
        var binding = this
        var elem = this.element
        callback = function (e) {
            var fn = binding.getter || noop
            return fn.apply(this, binding.args.concat(e))
        }
        
        var eventType = binding.param.replace(/-\d+$/, "") // ms-on-mousemove-10
        if (eventType === "scan") {
            callback.call(elem, {
                type: eventType
            })
        } else if (typeof binding.specialBind === "function") {
            binding.specialBind(elem, callback)
        } else {
            var removeFn = avalon.bind(elem, eventType, callback)
        }
        binding.rollback = function () {
            if (typeof binding.specialUnbind === "function") {
                binding.specialUnbind()
            } else {
                avalon.unbind(elem, eventType, removeFn)
            }
        }
    }
})