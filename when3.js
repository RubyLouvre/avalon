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
    _id: 0xe38286e381ae,
    init: function() {
        this._next = null;
        this.callback = {
            ok: Deferred.ok,
            ng: Deferred.ng
        };
        return this;
    },
    resolve: function(val) {
        return this._fire("ok", val)
    },
    reject: function(err) {
        return this._fire("ng", err)
    },
    cancel: function() {
        (this.canceller || function() {
        }).apply(this);
        return this.init();
    },
    promise: function() {
        if (!this._promise) {
            var that = this

            this._promise = {
                then: function(onResolve, onReject) {
                    if (typeof that.timestamp === "funciton") {
                        that.timestamp = new Date - 0
                    }
                    return that._post(onResolve, onReject)
                }
            }
        }
        return this._promise
    },
    _post: function(fn1, fn2) {
        this._next = new Deferred();
        if (typeof fn1 === "function") {
            this._next.callback.ok = fn1;
        }
        if (typeof fn1 === "function") {
            this._next.callback.ng = fn2;
        }
        return this._next.promise();
    },
    _fire: function(okng, value) {
        var next = "ok";
        try {
            value = this.callback[okng].call(this, value);
        } catch (e) {
            next = "ng";
            value = e;
        }
        if (Deferred.isDeferred(value)) {
            value._next = this._next;
        } else {
            if (this._next)
                this._next._fire(next, value);
        }
        return this;
    }
};
Deferred.isDeferred = function(obj) {
    return !!(obj && typeof obj.then === "function");
};

function aaa() {
    var d = Deferred();
    console.log("11111111111111111")
    setTimeout(function() {
        d.resolve(10)
    }, 1000)
    return d.promise()
}
aaa().then(function(a) {
    console.log(a)
    return a + 10
}).then(function(a) {
    console.log(a)
}).then(function(a) {
    var d = Deferred(), t = new Date();
    setTimeout(function() {
        console.log("11111111111")
        d.resolve(a + 100)
    }, 2000);
     return d.promise()
}).then(function(a) {
    console.log(a)
})