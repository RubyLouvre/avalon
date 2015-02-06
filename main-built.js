define("aaa", [], function() {
    return"AAA"
}), define("bbb", [], function() {
    return"bbb"
}), define("eee/eee", [], function() {
    return 333
}), define("eee/ddd", ["./eee"], function(e) {
    return 222 + e
}), define("ccc", ["./eee/ddd"], function(e) {
    return"ccc" + e
}), define("normalize", [], function() {
    function s(e, i, s) {
        if (e.match(r) || e.match(n))
            return e;
        e = t(e);
        var a = s.match(n), f = i.match(n);
        return f && (!a || a[1] != f[1] || a[2] != f[2]) ? o(e, i) : u(o(e, i), s)
    }
    function o(e, t) {
        e.substr(0, 2) == "./" && (e = e.substr(2));
        if (e.match(r) || e.match(n))
            return e;
        var i = t.split("/"), s = e.split("/");
        i.pop();
        while (curPart = s.shift())
            curPart == ".." ? i.pop() : i.push(curPart);
        return i.join("/")
    }
    function u(e, t) {
        var n = t.split("/");
        n.pop(), t = n.join("/") + "/", i = 0;
        while (t.substr(i, 1) == e.substr(i, 1))
            i++;
        while (t.substr(i, 1) != "/")
            i--;
        t = t.substr(i + 1), e = e.substr(i + 1), n = t.split("/");
        var r = e.split("/");
        out = "";
        while (n.shift())
            out += "../";
        while (curPart = r.shift())
            out += curPart + "/";
        return out.substr(0, out.length - 1)
    }
    var e = /([^:])\/+/g, t = function(t) {
        return t.replace(e, "$1/")
    }, n = /[^\:\/]*:\/\/([^\/])*/, r = /^(\/|data:)/, a = function(e, n, r) {
        n = t(n), r = t(r);
        var i = /@import\s*("([^"]*)"|'([^']*)')|url\s*\((?!#)\s*(\s*"([^"]*)"|'([^']*)'|[^\)]*\s*)\s*\)/ig, o, u, e;
        while (o = i.exec(e)) {
            u = o[3] || o[2] || o[5] || o[6] || o[4];
            var a;
            a = s(u, n, r);
            var f = o[5] || o[6] ? 1 : 0;
            e = e.substr(0, i.lastIndex - u.length - f - 1) + a + e.substr(i.lastIndex - f - 1), i.lastIndex = i.lastIndex + (a.length - u.length)
        }
        return e
    };
    return a.convertURIBase = s, a.absoluteURI = o, a.relativeURI = u, a
}), define("css", [], function() {
    if (typeof window == "undefined")
        return{load: function(e, t, n) {
                n()
            }};
    var e = document.getElementsByTagName("head")[0], t = window.navigator.userAgent.match(/Trident\/([^ ;]*)|AppleWebKit\/([^ ;]*)|Opera\/([^ ;]*)|rv\:([^ ;]*)(.*?)Gecko\/([^ ;]*)|MSIE\s([^ ;]*)|AndroidWebKit\/([^ ;]*)/) || 0, n = !1, r = !0;
    t[1] || t[7] ? n = parseInt(t[1]) < 6 || parseInt(t[7]) <= 9 : t[2] || t[8] ? r = !1 : t[4] && (n = parseInt(t[4]) < 18);
    var i = {};
    i.pluginBuilder = "./css-builder";
    var s, o, u = function() {
        s = document.createElement("style"), e.appendChild(s), o = s.styleSheet || s.sheet
    }, a = 0, f = [], l, c = function(e) {
        a++, a == 32 && (u(), a = 0), o.addImport(e), s.onload = function() {
            h()
        }
    }, h = function() {
        l();
        var e = f.shift();
        if (!e) {
            l = null;
            return
        }
        l = e[1], c(e[0])
    }, p = function(e, t) {
        (!o || !o.addImport) && u();
        if (o && o.addImport)
            l ? f.push([e, t]) : (c(e), l = t);
        else {
            s.textContent = '@import "' + e + '";';
            var n = setInterval(function() {
                try {
                    s.sheet.cssRules, clearInterval(n), t()
                } catch (e) {
                }
            }, 10)
        }
    }, d = function(t, n) {
        var i = document.createElement("link");
        i.type = "text/css", i.rel = "stylesheet";
        if (r)
            i.onload = function() {
                i.onload = function() {
                }, setTimeout(n, 7)
            };
        else
            var s = setInterval(function() {
                for (var e = 0; e < document.styleSheets.length; e++) {
                    var t = document.styleSheets[e];
                    if (t.href == i.href)
                        return clearInterval(s), n()
                }
            }, 10);
        i.href = t, e.appendChild(i)
    };
    return i.normalize = function(e, t) {
        return e.substr(e.length - 4, 4) == ".css" && (e = e.substr(0, e.length - 4)), t(e)
    }, i.load = function(e, t, r, i) {
        (n ? p : d)(t.toUrl(e + ".css"), r)
    }, i
}), define("css!style", [], function() {
}), define("css!style2", [], function() {
}), require.config({baseUrl: "./kkk", paths: {jquery: "jQuery/jquery"}}), require(["./aaa", "./bbb", "./ccc", "css!style.css", "css!style2.css"], function(e, t, n, r) {
    console.log([e, t, n, r] + " complete")
}), define("main", function() {
}), function(e) {
    var t = document, n = "appendChild", r = "styleSheet", i = t.createElement("style");
    i.type = "text/css", t.getElementsByTagName("head")[0][n](i), i[r] ? i[r].cssText = e : i[n](t.createTextNode(e))
}("body{\n    border:1px solid red\n}body{\n    color: green;\n}");