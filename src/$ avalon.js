//用于测试avalon是否能合并成功
new function() {
    var array = ["01 variable", "01 variable.share", "02 core", "03 es5.shim", "04 dom.polyfill","05 eventbus"]
    for (var i = 0, src; src = array[i++]; ) {
        document.write(unescape("%3Cscript src='" + src + ".js'%3E%3C/script%3E"));
    }
}



