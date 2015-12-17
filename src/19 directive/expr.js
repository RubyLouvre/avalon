directives["{{}}"] = {
    init: noop,
    change: function (value, binding) {
        binding.array[binding.index] = value
        var nodeValue = binding.array.join("")

        var node = binding.element
        if (nodeValue !== node.nodeValue) {
            node.change = "update"
            node.nodeValue = nodeValue
        }
    }
}