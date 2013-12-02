
;
(function() {
    if (window.require) {
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
            xhr.withCredentials = true
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
            xhr.send()
            return id
        }
    }
})()
