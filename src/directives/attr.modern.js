
var cssDir = require('./css')
var update = require('../dom/attr/modern')

avalon.directive('attr', {
    diff: cssDir.diff,
    update: update
})
