//如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
//标准浏览器使用__defineGetter__, __defineSetter__实现
var flag = true
try {
    Object.defineProperty({}, '_', {
        value: 'x'
    })
} catch (e) {
    flag = false
}

module.exports = flag