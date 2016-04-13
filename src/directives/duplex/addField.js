module.exports = function addField(node,vnode){
  if(vnode.props['data-duplex-validator']){
      while(!node){
          var options = node._ms_validator_
          if(options){
              ctrl.validator = options
              break
          }
          node = node.parentNode
      }
  }
}
