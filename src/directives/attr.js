
var attrUpdate = require('../dom/attr/compact')
var cssDir = require('./css')

avalon.directive('attr', {
    diff: cssDir.diff,
    //dom, vnode
    update: attrUpdate
})
