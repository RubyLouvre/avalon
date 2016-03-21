module.exports = {
    ident: /^[$a-zA-Z_][$a-zA-Z0-9_]*$/,
    sp: /^\s+$/, //全部都是空白,
    leftSp: /^\s+/, //左边空白
    rightSp: /s+$/, //右边空白,
    binding: /^ms-(\w+)-?(.*)/, //绑定属性,
    string: /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
}