avalon.injectBinding = function (binding) {

    parseExpr(binding.expr, binding.vmodel, binding)
//在ms-class中,expr: '["XXX YYY ZZZ",true]' 其path为空
    binding.paths.split("★").forEach(function (path) {
        var outerVm = adjustVm(binding.vmodel, path) || {}
        var match = String(outerVm.$hashcode).match(/^(a|o):(\S+):(?:\d+)$/)
        console.log(path,"path",match,binding.spath)
        if (match === 99) {
            binding.innerVm = outerVm
            binding.innerPath = path
            var repeatItem = match[2]
            if (path.indexOf(repeatItem) === 0) {
                if (match[1] === "o") {//处理对象循环 $val
                    //处理$val
                    var outerPath = outerVm.$id
                    var sindex = outerPath.lastIndexOf(".*.")
                    if (sindex > 0) {//处理多级对象
                        var innerId = outerPath.slice(0, sindex + 2)
                        for (var kj in outerVm) {//这个以后要移入到repeatItemFactory
                            if (outerVm[kj] && (outerVm[kj].$id === innerId)) {
                                binding.outerVm = outerVm[kj]
                                binding.outerPath = outerPath.slice(sindex + 3)
                                break
                            }
                        }
                    } else {//处理一层对象
                        var idarr = outerPath.match(rtopsub)
                        if (idarr) {
                            binding.outerPath = idarr[2] //顶层vm的$id
                            binding.outerVm = avalon.vmodels[idarr[1]]
                        }
                    }
                } else {//处理对象数组循环 el
                    if (typeof outerVm[repeatItem] === "object") {
                        binding.outerVm = outerVm[repeatItem]
                        binding.outerPath = path.replace(repeatItem + ".", "")
                    }
                }
            }
        } else {
            binding.outerVm = outerVm
            binding.outerPath = path
        }

//        if (binding.innerVm) {
//            try {
//                binding.innerVm.$watch(binding.innerPath, binding)
//            } catch (e) {
//                avalon.log(e, binding)
//            }
//        }
//        if (binding.innerVm && binding.outerVm) {
//            var array = binding.outerVm.$events[binding.outerPath]
//            var array2 = binding.innerVm.$events[binding.innerPath]
//            if (!array2) {
//                avalon.log(binding.innerPath, "对应的订阅数组不存在")
//            }
//            ap.push.apply(array2 || [], array || [])
//            binding.outerVm.$events[binding.outerPath] = array2
//        } else if (binding.outerVm) {//简单数组的元素没有outerVm
            try {
                binding.outerVm.$watch(binding.outerPath, binding)
            } catch (e) {
                avalon.log(e, binding)
            }
   //     }

        delete binding.innerVm
        delete binding.outerVm
    })
    delete binding.paths
    binding.update = function (a, b, p) {
        var vm = binding.vmodel
        //用于高效替换binding上的vmodel
        if (vm.$events.__vmodel__ !== vm) {
            vm = binding.vmodel = vm.$events.__vmodel__
        }

        var hasError
        try {
            var value = binding.getter(vm)
        } catch (e) {
            hasError = true
            avalon.log(e)
        }
        var dir = directives[binding.type]
        var is = dir.is || bindingIs
        if (!is(value, binding.oldValue)) {
            dir.change(value, binding)
            if (binding.oneTime && !hasError) {
                dir.change = noop
                setTimeout(function () {
                    delete binding.element
                })
            }
            if (dir.old) {
                dir.old(binding, value)
            } else {
                binding.oldValue = value
            }
        }
    }
    binding.update()
}