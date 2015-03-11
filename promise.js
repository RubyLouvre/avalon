var Deferred = function() {
    var tuples = [
        // action, add listener, listener list, final state
        ["resolve", "done", [], "resolved"],
        ["reject", "fail", [], "rejected"],
        ["notify", "progress", []]
    ],
            state = "pending",
            promise = {
                state: function() {
                    return state;
                },
                then: function( /* fnDone, fnFail, fnProgress */ ) {
                    var fns = arguments;
                    return Deferred(function(newDefer) {
                        tuples.forEach(function(tuple, i) {
                            var fn = avalon.isFunction(fns[ i ]) && fns[ i ];
                            // deferred[ done | fail | progress ] for forwarding actions to newDefer
                            deferred[ tuple[1] ](function() {
                                var returned = fn && fn.apply(this, arguments);
                                if (returned && avalon.isFunction(returned.promise)) {
                                    returned.promise()
                                            .done(newDefer.resolve)
                                            .fail(newDefer.reject)
                                            .progress(newDefer.notify);
                                } else {
                                    newDefer[ tuple[ 0 ] + "With" ](
                                            this === promise ? newDefer.promise() : this,
                                            fn ? [returned] : arguments
                                            );
                                }
                            });
                        });
                        fns = null;
                    }).promise();
                },
                // Get a promise for this deferred
                // If obj is provided, the promise aspect is added to the object
                promise: function(obj) {
                    return obj != null ? avalon.mix(obj, promise) : promise;
                }
            },
    deferred = {};


    // Add list-specific methods
    tuples.forEach(function(tuple) {
        var list = tuple[ 2 ],
                stateString = tuple[ 3 ],
                fireMethod = tuple[0]

        // promise[ done | fail | progress ] = list.push
        promise[ tuple[1] ] = list.push;

        // 添加deferred[ resolve | reject | notify ] 方法, 内部调用相应的xxxWith方法
        deferred[ fireMethod ] = function() {
            deferred[ fireMethod + "With" ](this === deferred ? promise : this, arguments);
            return this;
        };
        // resolve 与 reject 只能调一次, notify可以无数次
        deferred[ fireMethod + "With" ] = function(context, args) {
            if(fireMethod !== "notify"){
                state = stateString
                deferred[ fireMethod + "With" ] = function(){}
            }
            for (var k = 0, fn; fn = list[k++]; ) {
                fn.call(context, args)
            }
            return this
        }
    });

    // Make the deferred a promise
    promise.promise(deferred);



    // All done!
    return deferred;
}

