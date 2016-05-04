function isVML(src) {
    var nodeName = src.nodeName
    return nodeName.toLowerCase() === nodeName && src.scopeName && src.outerText === ''
}

module.exports = isVML