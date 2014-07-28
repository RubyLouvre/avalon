define("mmDeferred", ["avalon"], function(avalon) {
    //http://www.codingserf.com/index.php/2013/06/dropdownlist2/
    // 允许传入一个对象，它将混入到整条Deferred链的所有Promise对象 
    var noop = function() {
    }
    function Promise(fn) {
        var state = "pending", dirty = false, deferred = {} , that = this
        function ok(x) {
            state = "fulfilled"
            return x
        }
        function ng(e) {
            state = "rejected"
            throw e
        }
        avalon.mix(this, {
            callback: {
                resolve: ok,
                reject: ng,
                notify: noop,
                ensure: noop
            },
            dirty: function() {
                return dirty
            },
            state: function() {
                return state
            },
            then: function() {
                return _post.apply(null, arguments)
            },
            otherwise: function(onReject) {
                return _post(0, onReject)
            },
            "catch": function(onReject) {
                return _post(0, onReject)
            },
            //https://github.com/cujojs/when/issues/103
            ensure: function(onEnsure) {
                return _post(0, 0, 0, onEnsure)
            },
            _next: null
        })
   
        fn.call(this, deferred.resolve, deferred.reject, deferred.notify)
      
        //http://thanpol.as/javascript/promises-a-performance-hits-you-should-be-aware-of/
        "resolve,reject,notify".replace(/\w+/g, function(method) {
            deferred[method] = function() {
                var args = arguments
                //http://promisesaplus.com/ 4.1
                if (that.dirty()) {
                    _fire.call(that, method, args)
                } else {
                    Promise.nextTick(function() {
                        _fire.call(that, method, args)
                    })
                }
            }
        })
        return this

        function _post() {
            var index = -1, fns = arguments;
            //添加新回调
            "resolve,reject,notify,ensure".replace(/\w+/g, function(method) {
                var fn = fns[++index];
                if (typeof fn === "function") {
                    dirty = true
                    if (method === "resolve" || method === "reject") {
                        that.callback[method] = function() {
                            try {
                                var value = fn.apply(this, arguments)
                                state = "fulfilled"
                                return value
                            } catch (err) {
                                state = "rejected"
                                return err
                            }
                        }
                    } else {
                        that.callback[method] = fn;
                    }
                }
            })
            this._next = new Promise(function() {
            })
            return this;
        }

        function _fire(method, array) {
            var next = "resolve", value
            if (this.state() === "pending" || method === "notify") {
                var fn = this.callback[method]
                try {
                    value = fn.apply(this, array);
                } catch (e) {//处理notify的异常
                    value = e
                }
                if (this.state() === "rejected") {
                    next = "reject"
                } else if (method === "notify") {
                    next = "notify"
                }
                array = [value]
            }
            var ensure = this.callback.ensure
            if (noop !== ensure) {
                try {
                    ensure.call(this)//模拟finally
                } catch (e) {
                    next = "reject";
                    array = [e];
                }
            }
            var nextPromise = this._next
            if (Promise.isPromise(value)) {
                value._next = nextPromise
            } else {
                if (nextPromise) {
                    _fire.call(nextPromise, next, array);
                }
            }
        }
    }
    window.Promise = Promise;
    Promise.isPromise = function(obj) {
        return !!(obj && typeof obj.then === "function");
    };

    function some(any, promises) {


        var deferred = new Promise(function(a, b) {

        }), n = 0, result = [], end
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
    Promise.all = function() {
        return some(false, arguments)
    }
    Promise.any = function() {
        return some(true, arguments)
    }
    Promise.nextTick = avalon.nextTick
//http://www.raychase.net/1329
//http://www.cnblogs.com/iamzhanglei/archive/2013/02/24/2924680.html
    return Promise
})
