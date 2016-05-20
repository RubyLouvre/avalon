module.exports = function (cur, update, steps,  type, hookName) {
    hookName = hookName || 'change'
    var list = cur[hookName] || (cur[hookName] = [])
    if (avalon.Array.ensure(list, update)) {
        steps.count += 1
        avalon.config.showDiff && avalon.log(type+ ' change')
    }
}
