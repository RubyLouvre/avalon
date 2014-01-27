if (window.require && require.config) {
    require.config.plugins.text = function(url, y, checkDeps) {
        var modules = avalon.modules
        var xhr = new (self.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP")
        var id = url.replace(/[?#].*/, "")
        modules[id] = {}
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                var status = xhr.status;
                if (status > 399 && status < 600) {
                    //An http 4xx or 5xx error. Signal an error.
                    avalon.error(url + ' HTTP status: ' + status)
                } else {
                    modules[id].state = 2
                    modules[id].exports = xhr.responseText
                    avalon.require.checkDeps()
                }
            }
        }
        xhr.open("GET", url, true)
        if ("withCredentials" in xhr) {
            // Check if the XMLHttpRequest object has a "withCredentials" property.
            // "withCredentials" only exists on XMLHTTPRequest2 objects.
            xhr.withCredentials = true
        }
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
        xhr.send()
        return id
    }
}
//充许通过AMD进行加载或直接在页面引用，如果是AMD加载，请务必不改文件名（至少文件名保留“avalon.require.text”这些单词）
if (Object.keys(avalon.modules).join("").indexOf("avalon.require.text") > 0) {
    define(["avalon"], function(avalon) {
        return avalon
    })
}
