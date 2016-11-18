
var delayCompile = {}

export var directives = {}

export function directive(name, opts) {
    if( directives[name]){
        avalon.warn(name, 'directive have defined! ')
    }
    directives[name] = opts
    if(!opts.update){
        opts.update = function(){}
    }
    if (opts.delay) {
        delayCompile[name] = 1
    }
    return opts
}

export function delayCompileNodes(dirs) {
    for (var i in delayCompile) {
        if (('ms-' + i) in dirs) {
            return true
        }
    }
}
