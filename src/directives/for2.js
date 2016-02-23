/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


avalon._each = function (obj, fn) {
    if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            var value = obj[i]
            var type = typeof value
            var key = value && type === "object" ? obj : type + value
            fn(i, obj[i], key)
        }
    } else {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                fn(i, obj[i], i)
            }
        }
    }
}

avalon.directive("for", {
    parse: function (str, num) {
        var arr = str.replace(/for:\s+/, "").split(" in ")
        var def = "var eachObj" + num + " = " + parse(str[1]) + "\n"


        var kv = arr[0].replace(/^\s*\(\s*/, "").replace(/\s*\)\s*$/, "").split(/\s+,\s+/)
        if (kv.length === 1) {
            kv.unshift("$key")
        }

        return def + "avalon._each(eachObj" + num + ", function(" + kv + ",traceKey){\n\n"
    }
})
