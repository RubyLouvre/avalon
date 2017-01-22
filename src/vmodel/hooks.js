export function mergeHooks(hooks, name, hook) {
    var arr = hooks[name]
    if(arr){
        if(Array.isArray(arr)){
            arr.push(hook)
        }else{
            arr = [arr, hook]
        }
    }else{
        arr = [hook]
    }
    hooks[name] = arr
}


export function fireHooks(vm, name) {
    var key = 'on' + name
    var hooks = vm.$hooks[key]
    if (hooks) {
        if(typeof hooks ==='function'){
           hooks = vm.$hooks[key] = [hooks]
        }
        hooks.forEach(function(hook) {
            hook.call(vm, {
                type: name.toLowerCase(),
                target: vm.$element,
                vmodel: vm
            })
        })
    }
}