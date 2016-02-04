require("./base/es5.shim")
//var buildin = global.buildin = 
require("./base/builtin")
var avalon = global.avalon = require("./core/compact").avalon //这个版本兼容IE6

require("./core/static")
require("./dom/compact")
require("./filters/index")

avalon.define = require("./model/compact").define
avalon.mediatorFactory = require("./model/compact").mediatorFactory

require("./strategy/createVirtual")
require("./scan/scan")
require("./directives/compact")
module.exports = avalon


