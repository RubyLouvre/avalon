
var avalon = require('./seed/compact') //这个版本兼容IE6

require('./filters/index')
require('./vdom/index')
require('./dom/compact')
require('./directives/compact')
require('./strategy/index')
require('./component/index')
require('./vmodel/compact')

//require('./directives/panel/index')
//require('./directives/button/index')
module.exports = avalon


