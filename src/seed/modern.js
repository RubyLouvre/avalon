
var avalon = require('./core')
var browser = require('./browser')

avalon.mix(avalon, browser)

require('./lang.modern')
require('./lang.share')
require('./config')

module.exports = avalon