function modelFactory(scope) {
    var accessors = [];
    var d = {}
    for (var i in scope) {
        var o = makeGetSet(i, scope[i])
        d[i] = o
        accessors.push(o)
    }
    
    Object.defineProperties(scope, d )

}

function makeGetSet(key, value) {
    var childOb = observe(value)
    var dep = new Dep()
    if (childOb) {
        childOb.deps.push(dep)
    }
    return {
        key: key,
        get: function () {
            if (this.$active) {
                dep.depend()
            }
            return value
        },
        set: function (newVal) {
            if (newVal === value)
                return
            if (childOb) {
                childOb.deps.$remove(dep)
            }
            value = newVal
            // add dep to new value
            var newChildOb = Observe(newVal)
            if (newChildOb) {
                newChildOb.deps.push(dep)
            }
            dep.notify()
        },
        enumerable: true,
        configurable: true
    }
}


function Dep() {
    this.subs = []
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null

var p = Dep.prototype

/**
 * Add a directive subscriber.
 *
 * @param {Directive} sub
 */

p.addSub = function (sub) {
    this.subs.push(sub)
}

/**
 * Remove a directive subscriber.
 *
 * @param {Directive} sub
 */

p.removeSub = function (sub) {
    var index = this.subs.indexOf(sub)
    if (index !== -1) {
        this.subs.splice(index, 1)
    }
}

/**
 * Add self as a dependency to the target watcher.
 */

p.depend = function () {
    if (Dep.target) {
        Dep.target.addDep(this)
    }
}

/**
 * Notify all subscribers of a new value.
 */

p.notify = function () {
    // stablize the subscriber list first
    var subs = this.subs
    for (var i = 0, l = subs.length; i < l; i++) {
        subs[i].update()
    }
}

function observe(obj) {
    if (!obj || obj.$id) {
        return obj
    }
    if (Array.isArray(obj)) {
        return observeArray(obj)
    } else {
        return observeObject(obj)
    }
}

function observeArray(array){
    for(var i in newProto){
        array[i] = newProto[i]
    }
    array.$active = true
    array.deps = [] 
    observeItem(array)
    return array
}


observeItem = function (items) {
  var i = items.length
  while (i--) {
    observe(items[i])
  }
}

var arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']
var arrayProto = Array.prototype
var newProto = {}

arrayMethods.forEach(function (method, index) {
    var original = arrayProto[method]
    newProto[method] = function () {
        // avoid leaking arguments:
        // http://jsperf.com/closure-with-arguments
        var i = arguments.length
        var args = new Array(i)
        while (i--) {
            args[i] = arguments[i]
        }
        var result = original.apply(this, args)
        var ob = this
        var inserted
        switch (method) {
            case 'push':
                inserted = args
                break
            case 'unshift':
                inserted = args
                break
            case 'splice':
                inserted = args.slice(2)
                break
        }
        if (inserted)
            observeItem(inserted)
        // notify change
        ob.notify()
        return result
    }
})

newProto.$notify = function () {
  var deps = this.deps
  for (var i = 0, l = deps.length; i < l; i++) {
    deps[i].notify()
  }
}
newProto.remove = function (el) { //移除第一个等于给定值的元素
    return this.removeAt(this.indexOf(el))
}
newProto.removeAt = function (index) { //移除指定索引上的元素
    if (index >= 0) {
        this.$model.splice(index, 1)
    }
    return  []
}
