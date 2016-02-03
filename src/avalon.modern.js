var buildin = global.buildin = require("./base/builtin")
var avalon = global.avalon = require("./core/modern").avalon //这个版本兼容IE10+

require("./core/static")
require("./dom/modern")

avalon.define = require("./model/modern").define
require("./strategy/createVirtual")
require("./scan/scan")