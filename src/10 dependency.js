/*********************************************************************
 *                           依赖调度系统                              *
 **********************************************************************/

//检测两个对象间的依赖关系
var dependencyDetection = (function () {
    var outerFrames = []
    var currentFrame
    return {
        begin: function (binding) {
            //accessorObject为一个拥有callback的对象
            outerFrames.push(currentFrame)
            currentFrame = binding
        },
        end: function () {
            currentFrame = outerFrames.pop()
        },
        collectDependency: function (array) {
            if (currentFrame) {
                //被dependencyDetection.begin调用
                currentFrame.callback(array)
            }
        }
    };
})()

//将绑定对象注入到其依赖项的订阅数组中
var roneval = /^on$/

function returnRandom() {
    return new Date() - 0
}

avalon.injectBinding = function (binding) {

    binding.handler = binding.handler || directives[binding.type].update || noop
    binding.update = function () {

        if(!avalon.contains(DOC, binding.element)){
            //已经删除的节点不再更新
            //https://github.com/RubyLouvre/avalon/issues/1919
            return
        }
        
        var begin = false
        if (!binding.getter) {
            begin = true
            dependencyDetection.begin({
                callback: function (array) {
                    injectDependency(array, binding)
                }
            })
            binding.getter = parseExpr(binding.expr, binding.vmodels, binding)
            binding.observers.forEach(function (a) {
                a.v.$watch(a.p, binding)
            })
            delete binding.observers
        }
        try {
            var args = binding.fireArgs, a, b
            delete binding.fireArgs
            if (!args) {
                if (binding.type === "on") {
                    a = binding.getter + ""
                } else {
                    try {
                        a = binding.getter.apply(0, binding.args)
                    } catch(e) {
                        a = null
                        avalon.log('execute expr : ' + binding.expr + ' Error. ' + e)
                    }
                }
            } else {
                a = args[0]
                b = args[1]
            }
            b = typeof b === "undefined" ? binding.oldValue : b
            if (binding._filters) {
                a = filters.$filter.apply(0, [a].concat(binding._filters))
            }
            if (binding.signature) {
                var xtype = avalon.type(a)
                if (xtype !== "array" && xtype !== "object") {
                    throw Error("warning:" + binding.expr + "只能是对象或数组")
                }
                binding.xtype = xtype
                var vtrack = getProxyIds(binding.proxies || [], xtype)
                var mtrack = a.$track || (xtype === "array" ? createTrack(a.length) :
                        Object.keys(a))
                binding.track = mtrack
                if (vtrack !== mtrack.join(";")) {
                    binding.handler(a, b)
                    binding.oldValue = 1
                }
            } else if (Array.isArray(a) ? a.length !== (b && b.length) : false) {
                binding.handler(a, b)
                binding.oldValue = a.concat()
            } else if (!("oldValue" in binding) || a !== b) {
                binding.handler(a, b)
                binding.oldValue = Array.isArray(a) ? a.concat() : a
            }
        } catch (e) {
            delete binding.getter
            log("warning:exception throwed in [avalon.injectBinding] ", e)
            var node = binding.element
            if (node && node.nodeType === 3) {
                node.nodeValue = openTag + (binding.oneTime ? "::" : "") + binding.expr + closeTag
            }
        } finally {
            begin && dependencyDetection.end()

        }
    }
    binding.update()
}

//将依赖项(比它高层的访问器或构建视图刷新函数的绑定对象)注入到订阅者数组
function injectDependency(list, binding) {
    if (binding.oneTime)
        return
    if (list && avalon.Array.ensure(list, binding) && binding.element) {
        injectDisposeQueue(binding, list)
        if (new Date() - beginTime > 444) {
            rejectDisposeQueue()
        }
    }
}

function getProxyIds(a, isArray) {
    var ret = []
    for (var i = 0, el; el = a[i++]; ) {
        ret.push(isArray ? el.$id : el.$key)
    }
    return ret.join(";")
}
