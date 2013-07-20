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
            notify:  Deferred.ok
        };
        this.state = "pending"
        var that = this
        this.promise = {
            then: function(onResolve, onReject, onNotify) {
                if (! that.timestamp ) {
                    that.timestamp = new Date - 0
                }
                return that._post(onResolve, onReject, onNotify)
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
    _post: function(fn0, fn1, fn2) {
        var deferred = this.promise._next = new Deferred();
        if (typeof fn0 === "function") {
            deferred.callback.resolve = fn0;
        }
        if (typeof fn1 === "function") {
            deferred.callback.reject = fn1;
        }
        if (typeof fn2 === "function") {
            deferred.callback.notify = fn2;
        }
        return deferred.promise;
    },
    _fire:  function(okng, value) {
        var next = "resolve";
        try {

            if(this.state == "pending" || okng == "notify") {
               var fn = this.callback[okng]
                value = fn.call(this, value);
                console.log(fn+"")
                if(okng !== "notify"){
                    this.state = okng
                }
            }
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
"resolve,reject,notify".replace(/\w+/g, function(method) {
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
function some(any, promises) {
    var deferred = Deferred(), n = 0, result = [], end
    function loop(promise) {
        promise.then(function(ret) {
            if (!end) {
                result.push(ret);
                n++;
                if (any || n >= promises.length) {
                    deferred.resolve(result);
                    end = true
                }
            }
        }, function(e) {
            end = true
            deferred.reject(e);
        })
    }
    for (var i = 0, l = promises.length; i < l; i++) {
        loop(promises[i])
    }
    return deferred.promise;
}
Deferred.all = function() {
    return some(false, arguments)
}
Deferred.any = function() {
    return some(true, arguments)
}
function aaa() {
    var d = Deferred();
    setTimeout(function() {
        d.resolve(10)
    }, 1000)
    return d.promise
}
function bbb() {
    var d = Deferred();
    setTimeout(function() {
        d.resolve(20)
    }, 2000)
    return d.promise
}
function ccc() {
    var d = Deferred();
    setTimeout(function() {
        d.resolve(210)
    }, 500)
    return d.promise
}

/*
//实现1
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
})     */
     /*
   // 实现2
        Deferred.all(aaa(), bbb()).then(function(a,b){
                         console.log(a)

        })
               */
/*
Deferred.any(aaa(), bbb(),ccc()).then(function(a,b){
    console.log(a)

})        */

function doSomething() {
    var dfd = Deferred();

    var count = 0;
    var intervalId = setInterval(function() {
     //   console.log("1111111111111")
        dfd.notify(count++);
        count > 10 && clearInterval(intervalId);
    }, 500);

    return dfd.promise;
};

var promise = doSomething();

promise.then(function(prog) {
    console.log(prog);
}, 0, function(a){

    console.log(a+"  !!!!!!!!!!!1")
    return "xxxxxxxxx"
});