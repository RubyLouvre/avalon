
define(["avalon"], function() {
    function jsEscape(content) {
        return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
    }
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
                    modules[id].exports = jsEscape(xhr.responseText)
                    avalon.require.checkDeps()
                }
            }
        }
        xhr.open("GET", url, true)
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
        xhr.send()
        return id
    }
})
