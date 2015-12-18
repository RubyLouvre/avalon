// executeBindings
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

avalon.injectBinding = function (binding) {
    parseExpr(binding.expr, binding.vmodel, binding)

    binding.paths.split("★").forEach(function (path) {
        binding.vmodel.$watch(path, binding)
    })
    delete binding.paths
    binding.update = function () {
        var hasError
        try {
            var value = binding.getter(binding.vmodel)
        } catch (e) {
            hasError = true
            avalon.log(e)
        }
        var dir = directives[binding.type]
        var is = dir.is || bindingIs
        if (!is(value, binding.oldValue)) {
            dir.change(value, binding)
            if (binding.oneTime && !hasError) {
                dir.change = noop
                setTimeout(function () {
                    delete binding.element
                })
            }
            binding.oldValue = value
        }
    }
    binding.update()
}

// attr css class data duplex

// aaa.bb.ccc
