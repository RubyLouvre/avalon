var msPromise = function(executor) {
    this._callbacks = []
    var me = this
    if (typeof this !== 'object')
        throw new TypeError('Promises must be constructed via new')
    if (typeof executor !== 'function')
        throw new TypeError('not a function')
    executor(function(value) {
        _resolve(me, value)
    }, function(reason) {
        _reject(me, reason)
    })
}
var asyncExecute = typeof window.setImmediate === "function" ? function(fn) {
    window.setImmediate(fn)
} : function(fn) {
    window.setTimeout(fn, 0)
}
function syncExecute(fn) {
    fn()
}

msPromise.prototype = {
    //一个Promise对象一共有3个状态：
    //- `pending`：还处在等待状态，并没有明确最终结果
    //- `resolved`：任务已经完成，处在成功状态
    //- `rejected`：任务已经完成，处在失败状态
    constructor: msPromise,
    _state: "pending",
    _fired: false, //判定是否已经被触发
    _fire: function(onSuccess, onFail) {
        if (this._state === "rejected") {
            if (typeof onFail === "function") {
                onFail(this._value)
            } else {
                throw this._value
            }
        } else {
            if (typeof onSuccess === "function") {
                onSuccess(this._value)
            }
        }
    },
    _then: function(onSuccess, onFail) {
        if (this._fired) {//在已有Promise上添加回调
            var me = this
            var execute = me.async ? asyncExecute : syncExecute
            execute(function() {
                me._fire(onSuccess, onFail)
            });
        } else {
            this._callbacks.push({onSuccess: onSuccess, onFail: onFail})
        }
    },
    then: function(onSuccess, onFail) {
        var me = this//在新的Promise上添加回调
        var nextPromise = new msPromise(function(resolve, reject) {
            me._then(function(value) {
                if (typeof onSuccess === "function") {
                    try {
                        value = onSuccess(value)
                    } catch (e) {
                        reject(e)
                        return
                    }
                }
                resolve(value)
            }, function(value) {
                if (typeof onFail === "function") {
                    try {
                        value = onFail(value)
                    } catch (e) {
                        reject(e)
                        return
                    }
                    resolve(value)
                } else {
                    reject(value)
                }
            })
        })
        for (var i in me) {
            if (!msPromise.prototype[i]) {
                nextPromise[i] = me[i]
            }
        }
        return nextPromise
    },
    "done": done,
    "catch": fail,
    "fail": fail
}
function _resolve(promise, value) {//触发成功回调
    if (promise._state !== "pending")
        return
    promise._state = "fulfilled"
    //如果是一个类Promise对象
    if (value && typeof value.then === "function") {
        //如果有_then使用_then
        var method = typeof promise._then === "function" ? "_then" : "then"
        value[method](function(val) {
            _transmit(promise, val)
        }, function(reason) {
            promise._state = "rejected"
            _transmit(promise, reason)
        });
    } else {
        //如果是单纯的传值
        _transmit(promise, value);
    }
}
function _reject(promise, value) {//触发失败回调
    if (promise._state !== "pending")
        return
    promise._state = "rejected"
    _transmit(promise, value)
}

//改变Promise的_fired值，并保持用户传参，触发所有回调
function _transmit(promise, value) {
    promise._fired = true
    promise._value = value
    var execute = promise.async ? asyncExecute : syncExecute
    execute(function() {
        promise._callbacks.forEach(function(data) {
            promise._fire(data.onSuccess, data.onFail);
        })
    })
}


function done(onSuccess) {//添加成功回调
    return this.then(onSuccess)
}
function fail(onFail) {//添加出错回调
    return this.then(null, onFail)
}

mmPromise.prototype.done = done
mmPromise.prototype.fail = fail