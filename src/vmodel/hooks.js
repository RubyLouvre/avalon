export function mergeHooks(hooks, name, hook) {
    var arr = hooks[name]
    arr = arr ? (Array.isArray(arr) ?
        arr.push(hook) : [arr, hook]) : [hook]
    hooks[name] = arr
}


export function fireHooks(vm, name) {
    var hooks = vm.$hooks['on' + name]
    if (hooks) {
        hooks.forEach(function(hook) {
            hook.call(vm, {
                type: name.toLowerCase(),
                target: vm.$element,
                vmodel: vm
            })
        })
    }
}