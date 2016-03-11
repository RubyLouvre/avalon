
var avalon = require('./core/compact').avalon //这个版本兼容IE6

require('./filters/index')
require('./vdom/index')
require('./dom/compact')
require('./directives/compact')


require('./model/compact')

require('./parser/parse')

require('./directives/panel/index')
//require('./directives/button/index')
module.exports = avalon


