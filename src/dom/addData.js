function addData(elem, name) {
    return elem[name] || (elem[name] = {})
}
module.exports = addData