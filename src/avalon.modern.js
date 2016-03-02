var buildin = global.buildin = require("./base/builtin")
var avalon = global.avalon = require("./core/modern").avalon //这个版本兼容IE10+

require("./core/static")
require("./dom/modern")
require("./filters/index")

avalon.define = require("./model/modern").define
avalon.mediatorFactory = require("./model/modern").mediatorFactory

require("./strategy/createVirtual")
require("./directives/modern")
module.exports = avalon
