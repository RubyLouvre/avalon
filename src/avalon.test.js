
//
//var avalon = require('./seed/modern') 
//
//require('./filters/index')
//require('./vdom/index')
//require('./dom/modern')
//require('./directives/modern')
//require('./strategy/index')
//require('./component/index')
//require('./vmodel/modern')

var avalon = require('./seed/compact') //这个版本兼容IE6

require('./filters/index')
require('./vdom/index')
require('./dom/compact')
require('./directives/compact')
require('./strategy/index')
require('./component/index')
require('./vmodel/compact')


require('../components/button/index')
require('../components/panel/index')
module.exports = avalon


