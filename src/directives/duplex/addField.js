module.exports = function addField(node, vnode) {
    var field = vnode.field
    if (vnode.props['data-validators'] && !field.validator) {
        while (node && node.nodeType === 1) {
            var validator = node._ms_validator_
            if (validator) {
                field.validators = vnode.props['data-validators']
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
