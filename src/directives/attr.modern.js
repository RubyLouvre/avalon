
var attrUpdate = require('../dom/attr/modern')
var cssDir = require('./css')

avalon.directive('attr', {
    diff: cssDir.diff,
    //dom, vnode
    update: attrUpdate
})
