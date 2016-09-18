var avalon = require('./seed/modern') 

require('./filters/index')
require('./vdom/modern')
require('./dom/modern')
require('./directives/modern')
require('./strategy/index')
require('./vmodel/next')
avalon._disposeComponent = require('./component/dispose.compact')


module.exports = avalon
