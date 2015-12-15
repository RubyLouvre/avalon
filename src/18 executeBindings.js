function executeBindings(bindings, vmodel) {
    for (var i = 0, binding; binding = bindings[i++]; ) {
        binding.vmodel = vmodel
        directives[binding.type].init(binding)
        avalon.injectBinding(binding)
    }
    bindings.length = 0
}
function bindingIs(a, b) {
    return a === b
}

avalon.injectBinding = function (binding, vmodel) {
    parseExpr(binding.expr, binding.vmodel, binding)
    binding.paths.split("★").forEach(function (path) {
        vmodel.$watch(path, binding)
    })
    delete binding.paths
    binding.update = function () {
        try {
            var value = binding.getter(binding.vmodel)
        } catch (e) {
        }
        var is = binding.is || bindingIs
        if (!is(value, binding.oldValue)) {
            directives[binding.type].update(value, binding)
            binding.oldValue = value
        }
    }

}

// attr css class data duplex

// aaa.bb.ccc
