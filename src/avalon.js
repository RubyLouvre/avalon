
var avalon = require('./seed/compact') //这个版本兼容IE6

require('./filters/index')
require('./vdom/compact')
require('./dom/compact')
require('./directives/compact')
require('./strategy/index')
require('./vmodel/compact')

module.exports = avalon


