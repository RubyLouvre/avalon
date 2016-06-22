
var avalon = require('./seed/compact') //这个版本兼容IE6

require('./filters/index')
require('./vdom/index')
require('./dom/compact')
require('./directives/compact')
require('./strategy/index')
avalon.onComponentDispose = require('./component/dispose.compact')
require('./vmodel/compact')

module.exports = avalon


