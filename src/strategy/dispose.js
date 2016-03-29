module.exports = function dispose(children){
    if(children){
        for(var i = 0, el; el = children[i++];){
            if(el.nodeType === 1){
                dispose(el.children)
            }else if(el.nodeType === 8 && el.directive){
                dispose(el.components)
                el.endRepeat = el.domTemplate = null
            }
            el.props = null
        }
    }
}

