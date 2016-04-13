module.exports = function addField(node,vnode){
  if(vnode.props['data-validators']){
      while(!node){
          var options = node._ms_validator_
          if(options){
              vnode.ctrl.validator = options
              break
          }
          node = node.parentNode
      }
  }
}
