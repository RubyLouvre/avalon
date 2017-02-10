function $watch(expr, binding) {
    var $events = this.$events || (this.$events = {}),
        queue = $events[expr] || ($events[expr] = [])

    if (typeof binding === "function") {
        var backup = binding
        backup.uuid = "_"+ (++bindingID)
        binding = {
            element: root,
            type: "user-watcher",
            handler: noop,
            vmodels: [this],
            expr: expr,
            uuid: backup.uuid
        }
        binding.wildcard = /\*/.test(expr)
    }

    if (!binding.update) {
        if (/\w\.*\B/.test(expr) || expr === "*") {
            binding.getter = noop
            var host = this
            binding.update = function () {
                var args = this.fireArgs || []
                if (args[2])
                    binding.handler.apply(host, args)
                delete this.fireArgs
            }
            queue.sync = true
            avalon.Array.ensure(queue, binding)
        } else {
            avalon.injectBinding(binding)
        }
        if (backup) {
            binding.handler = backup
        }
    } else if (!binding.oneTime) {
        avalon.Array.ensure(queue, binding)
    }

    return function () {
        binding.update = binding.getter = binding.handler = noop
        binding.element = DOC.createElement("a")
    }
}

function $emit(key, args) {
    var event = this.$events
    if (event && event[key]) {
        if (args) {
            args[2] = key
        }
        var arr = event[key]
        notifySubscribers(arr, args)
        if (args && event["*"] && !/\./.test(key)) {
            for (var sub, k = 0; sub = event["*"][k++]; ) {
                try {
                    sub.handler.apply(this, args)
                } catch (e) {
                }
            }
        }
        var parent = this.$up
        if (parent) {
            if (this.$pathname) {
                $emit.call(parent, this.$pathname + "." + key, args)//以确切的值往上冒泡
            }
            $emit.call(parent, "*." + key, args)//以模糊的值往上冒泡
        }
    } else {
        parent = this.$up
        if (this.$ups) {
            for (var i in this.$ups) {
                $emit.call(this.$ups[i], i + "." + key, args)//以确切的值往上冒泡
            }
            return
        }
        if (parent) {
            var p = this.$pathname
            if (p === "")
                p = "*"
            var path = p + "." + key
            arr = path.split(".")
            if (arr.indexOf("*") === -1) {
                $emit.call(parent, path, args)//以确切的值往上冒泡
                arr[1] = "*"
                $emit.call(parent, arr.join("."), args)//以模糊的值往上冒泡
            } else {
                $emit.call(parent, path, args)//以确切的值往上冒泡
            }
        }
    }
}

function collectDependency(el, key) {
    do {
        if (el.$watch) {
            var e = el.$events || (el.$events = {})
            var array = e[key] || (e[key] = [])
            dependencyDetection.collectDependency(array)
            return
        }
        el = el.$up
        if (el) {
            key = el.$pathname + "." + key
        } else {
            break
        }
    } while (true)
}

function notifySubscribers(subs, args) {
    if (!subs)
        return
    if (new Date() - beginTime > 444 && typeof subs[0] === "object") {
        rejectDisposeQueue()
    }
    var users = [], renders = []
    for (var i = 0, sub; sub = subs[i++]; ) {
        if (sub.type === "user-watcher") {
            users.push(sub)
        } else {
            //有一些Node已经不在Document里了，阻止死亡节点的更新
            //https://github.com/RubyLouvre/avalon/issues/1919
            if(sub.update && avalon.contains(DOC, sub.element)){
                renders.push(sub)
            }
        }
    }
    if (kernel.async) {
        buffer.render()//1
        for (i = 0; sub = renders[i++]; ) {
            if (sub.update) {
                sub.uuid = sub.uuid || "_"+(++bindingID)
                var uuid = sub.uuid
                if (!buffer.queue[uuid]) {
                    buffer.queue[uuid] = "__"
                    buffer.queue.push(sub)
                }
            }
        }
    } else {
        for (i = 0; sub = renders[i++]; ) {
            if (sub.update) {
                sub.update()//最小化刷新DOM树
            }
        }
    }
    for (i = 0; sub = users[i++]; ) {
        if (args && args[2] === sub.expr || sub.wildcard) {
            sub.fireArgs = args
        }
        sub.update()
    }
}
