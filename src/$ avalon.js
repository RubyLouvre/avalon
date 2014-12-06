new function() {
    var array = []
    for (var i = 0, src; src = array[i++]; ) {
        document.write(unescape("%3Cscript src='" + src + ".js'%3E%3C/script%3E"));
    }
}



