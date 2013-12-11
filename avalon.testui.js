define(["avalon"], function(avalon) {
    avalon.ui["testui"] = function(element, data, vmodels) {

        var innerHTML = element.innerHTML //将它内部作为模板，或者使用文档碎片进行处理
        //由于innerHTML要依赖许多widget后来添加的新属性，这时如果被扫描肯定报“不存在”
        //因此先将它清空
        avalon.clearChild(element)
        var model = avalon.define(data.testuiId, function(vm) {
            avalon.mix(vm, data.testuiOptions)//优先添加用户的配置，防止它覆盖掉widget的一些方法与属性
            vm.value = 0; // 给input一个个默认的数值
            vm.plus = function(e) { // 只添加了这个plus
                model.value++;
            }
        })
        avalon.nextTick(function() {
            //widget的VM已经生成，可以添加回去让它被扫描
            element.innerHTML = innerHTML
            avalon.scan(element, [model].concat(vmodels))
        })
        return model
    }
    avalon.ui["testui"].defaults = {
        aaa: "aaa",
        bbb: "bbb",
        ccc: "ccc"
    }
    return avalon
})


//http://mottie.github.io/Keyboard/navigate.html
//http://bgrins.github.io/spectrum/#why-footprint