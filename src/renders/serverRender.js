function serverRender(vm, str) {
    var nodes = avalon.lexer(str)
    var templates = {}
    collectTemplate(nodes, templates)
    var render = avalon.scan(str)
    var html = avalon.vdom(render.root, 'toHTML', false)
    console.log('=======begin========')
    console.log(html)
    console.log('========end=========')
    return {
        templates: templates,
        html: html
    }
}

function collectTemplate(vdoms, obj) {
    for (var i = 0, el; el = vdoms[i++]; ) {
        var props = el.props
        if (props) {
            var id = props['ms-controller'] ||
                     props[':controller'] ||
                     props['ms-important'] ||
                     props[':important']
            if (id) {
                obj[id] = avalon.VElement.prototype.toHTML.call(el, true)
                continue
            }
        }
        if (el.children) {
            collectTemplate(el.children, obj)
        }
    }
}

if(typeof module === 'object')

   module.exports = serverRender