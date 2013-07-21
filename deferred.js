function Deferred() {
    return (this instanceof Deferred) ? this.init() : new Deferred()
}
Deferred.ok = function(x) {
    return x
};
Deferred.ng = function(x) {
    throw  x
};
Deferred.prototype = {
    init: function() {
        this.callback = {
            resolve: Deferred.ok,
            reject: Deferred.ng,
            notify: Deferred.ok,
            ensure: Deferred.ok
        };

        var that = this
        this.state = "pending"
        this.promise = {
            then: function(onResolve, onReject, onNotify) {

                return that._post(onResolve, onReject, onNotify)
            },
            otherwise: function(onReject) {

                return that._post(null, onReject, null)
            },
            //https://github.com/cujojs/when/issues/103
            ensure: function(onEnsure) {
                return that._post(0, 0, 0, onEnsure)
            },
            _next: null
        }
        return this;
    },
    _post: function(fn0, fn1, fn2, fn3) {
        this.timestate = new Date - 0
        var deferred
        if (this.callback.resolve === Deferred.ok &&
                this.callback.reject === Deferred.ng &&
                this.callback.notify === Deferred.ok &&
                this.callback.ensure === Deferred.ok
                ) {
            deferred = this;
        } else {
            deferred = this.promise._next = new Deferred();
        }

        var index = -1, fns = arguments;
        "resolve,reject,notify, ensure".replace(/\w+/g, function(method) {
            var fn = fns[++index];
            if (typeof fn === "function") {
                deferred.callback[method] = fn;
            }
        })
        return deferred.promise;
    },
    _fire: function(method, value) {
        var next = "resolve";
        try {
            if (this.state == "pending" || method == "notify") {
                var fn = this.callback[method]
                value = fn.call(this, value);
                if (method !== "notify") {
                    this.state = method
                } else {
                    next = "notify"
                }
            }
        } catch (e) {
            next = "reject";
            value = e;
        }
        var ensure = this.callback.ensure
        if (Deferred.ok !== ensure) {
            try {
                ensure.call(this)
            } catch (e) {
                next = "reject";
                value = e;
            }
        }


        if (Deferred.isPromise(value)) {
            value._next = this.promise._next
        } else {

            if (this.promise._next) {
                this.promise._next._fire(next, value);
            }

        }
        return this;
    }
};
//http://thanpol.as/javascript/promises-a-performance-hits-you-should-be-aware-of/
"resolve,reject,notify".replace(/\w+/g, function(method) {
    Deferred.prototype[method] = function(val) {
        //http://promisesaplus.com/ 4.1
        if (!this.timestate) {
            var that = this;
            setTimeout(function() {
                that._fire(method, val)
            }, 0)
        } else {
            return this._fire(method, val)
        }
    }
})
Deferred.isPromise = function(obj) {
    return !!(obj && typeof obj.then === "function");
};

function some(any, promises) {
    var deferred = Deferred(), n = 0, result = [], end
    function loop(promise, index) {
        promise.then(function(ret) {
            if (!end) {
                result[index] = ret//保证回调的顺序
                n++;
                if (any || n >= promises.length) {
                    deferred.resolve(any ? ret : result);
                    end = true
                }
            }
        }, function(e) {
            end = true
            deferred.reject(e);
        })
    }
    for (var i = 0, l = promises.length; i < l; i++) {
        loop(promises[i], i)
    }
    return deferred.promise;
}
Deferred.all = function() {
    return some(false, arguments)
}
Deferred.any = function() {
    return some(true, arguments)
};
(function() {
    return
    var BrowserMutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (BrowserMutationObserver) {//chrome firefox
        Deferred.nextTick = function(callback) {
            var input = document.createElement("input")
            var observer = new BrowserMutationObserver(function(mutations) {
                mutations.forEach(function() {
                    callback()
                });
            });
            observer.observe(input, {attributes: true});
            input.setAttribute("value", Math.random())
        }
    } else if (window.VBArray) {//IE
        Deferred.nextTick = function(callback) {
            var node = document.createElement("script");
            node.onreadystatechange = function() {
                callback()
                node.onreadystatechange = null
                node.parentNode && node.parentNode.removeChild(node);
                node = null;
            };
            document.documentElement.appendChild(node);
        }
    } else if (window.postMessage && window.addEventListener) {//safar opera
        Deferred.nextTick = function(callback) {
            function onGlobalMessage(event) {
                if (typeof event.data === "string" && event.data.indexOf("usePostMessage") === 0) {
                    callback()
                }
            }
            window.addEventListener("message", onGlobalMessage);
            var now = new Date - 0;
            window.postMessage("usePostMessage" + now, "*");
        }
    } else {
        Deferred.nextTick = function(callback) {
            setTimeout(callback, 0)
        }
    }


})();
