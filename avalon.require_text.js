define(function() {
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
        var xhr = new (self.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP")
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                var status = xhr.status;
                if (status > 399 && status < 600) {
                    //An http 4xx or 5xx error. Signal an error.
                    avalon.error(url + ' HTTP status: ' + status);
                } else {
                    var id = url.replace(/[?#].*/, "")
                    var modules = avalon.modules
                    modules[id].state = 2
                    modules[id].exports = jsEscape(xhr.responseText)
                    checkDeps()
                }
            }
        }
        xhr.open("GET", url, true);
        xhr.send();
    }
})
