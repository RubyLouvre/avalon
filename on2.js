var rdash = /\(([^)]*)\)/
bindingHandlers.on = function(data, vmodels) {
    var value = data.value
    data.type = "on"
    var eventType = data.param.replace(/-\d+$/, "") // ms-on-mousemove-10
    if (typeof bindingHandlers.on[eventType + "Hook"] === "function") {
        bindingHandlers.on[eventType + "Hook"](data)
    }
    if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
        var matched = (value.match(rdash) || ["", ""])[1].trim()
        if (matched === "" || matched === "$event") { // aaa() aaa($event)当成aaa处理
            value = value.replace(rdash, "")
        }
    }
    parseExprProxy(value, vmodels, data)
}
var hasRegistryEvent = {}
function createTopCallback(type){
    return function(e){
        var event = fixEvent(e)
        event.type = type
        console.log(e.target)
    }
}

bindingExecutors.on = function(callback, elem, data) {
    var eventType = data.param.replace(/-\d+$/, "")
    if(hasRegistryEvent[eventType]){
        hasRegistryEvent[eventType].push(data)
    }else{
        avalon.bind(DOC, eventType, createTopCallback(eventType))
        hasRegistryEvent[eventType] = [data]
    }
    

//    callback = function(e) {
//        var fn = data.evaluator || noop
//        return fn.apply(this, data.args.concat(e))
//    }
//    var eventType = data.param.replace(/-\d+$/, "") // ms-on-mousemove-10
//    if (eventType === "scan") {
//        callback.call(elem, {
//            type: eventType
//        })
//    } else if (typeof data.specialBind === "function") {
//        data.specialBind(elem, callback)
//    } else {
//        var removeFn = avalon.bind(elem, eventType, callback)
//    }
//    data.rollback = function() {
//        if (typeof data.specialUnbind === "function") {
//            data.specialUnbind()
//        } else {
//            avalon.unbind(elem, eventType, removeFn)
//        }
//    }
}