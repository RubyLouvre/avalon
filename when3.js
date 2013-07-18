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
            reject: Deferred.ng
        };
        var that = this
        this.promise = {
            then: function(onResolve, onReject) {
                if (! that.timestamp ) {
                    that.timestamp = new Date - 0
                }
                return that._post(onResolve, onReject)
            },
            _next: null
        }
        return this;
    },
    cancel: function() {
        (this.canceller || function() {
        }).apply(this);
        return this.init();
    },
    _post: function(fn1, fn2) {
        var deferred = this.promise._next = new Deferred();
        if (typeof fn1 === "function") {
            deferred.callback.resolve = fn1;
        }
        if (typeof fn1 === "function") {
            deferred.callback.reject = fn2;
        }
        return deferred.promise;
    },
    _fire: function(okng, value) {
        var next = "resolve";
        try {
            value = this.callback[okng].call(this, value);
        } catch (e) {
            next = "reject";
            value = e;
        }
        if (Deferred.isDeferred(value)) {
            value._next = this.promise._next
        } else {
            if (this.promise._next)
                this.promise._next._fire(next, value);
        }
        return this;
    }
};
"resolve,reject".replace(/\w+/g, function(method) {
    Deferred.prototype[method] = function(val) {
        if (!this.timestamp) {
            var that = this;
            setTimeout(function() {
                that._fire(method, val)
            }, 0)
        } else {
            return this._fire(method, val)
        }
    }
})
Deferred.isDeferred = function(obj) {
    return !!(obj && typeof obj.then === "function");
};
function aaa() {
    var d = Deferred();
    setTimeout(function() {
        d.resolve(10)
    }, 1000)
    return d.promise
}
aaa().then(function(a) {
    console.log(a)
    return a + 10
}, function(e) {
    console.log("xxxxxx" + e)
    return e
}).then(function(a) {
    console.log(a)
    return a
}).then(function(a) {
    var dd = Deferred(), t = new Date();
    setTimeout(function() {
        dd.resolve(a + 100)
    }, 2000);
    return dd.promise
}).then(function(a) {
    console.log(a + "!!!!!!!")
})