
var Cache = require('../../seed/cache')
//缓存求值函数，以便多次利用
module.exports = new Cache(512)
