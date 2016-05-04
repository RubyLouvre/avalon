
module.exports = function addField(node, vnode) {
    var field = vnode.field
    var rules = vnode.props['ms-rules']
    if (rules && !field.validator) {
        while (node && node.nodeType === 1) {
            var validator = node._ms_validator_
            if (validator) {
                field.rules = rules
                field.validator = validator
                if(avalon.Array.ensure(validator.fields, field)){
                    validator.addField(field)
                }
                break
            }
            node = node.parentNode
        }
    }
}
