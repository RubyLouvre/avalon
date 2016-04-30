var scanTag = require('./scanTag')
avalon.scan = function (elem, vmodel) {
    elem = elem || avalon.root
    scanTag(elem, vmodel)
}
