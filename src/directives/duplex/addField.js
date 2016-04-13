module.exports = function addField(node, vnode){
  if(vnode.props['data-validators'] &&  !vnode.field.validator){
      while(node && node.nodeType === 1){
          var options = node._ms_validator_
          if(options){
              vnode.field.validators = vnode.props['data-validators']
              vnode.field.validator = options
              avalon.Array.ensure(options.fields, vnode.field)
              break
          }
          node = node.parentNode
      }
  }
}
