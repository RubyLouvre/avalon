var cssDir = require('./css')
var update = require('../dom/attr/compact')

avalon.directive('attr', {
    diff: cssDir.diff,
    update: update
})
