avalon2 vm的设计

@param {String} $id  元素节点的ID，也是VM的名字，用户定义的必须是唯一的

@param {Object} $events  放置各种$watch回调及生命周期回调，$created, $disposed, *, 属性路径

@param {Function} $watch[^watch]添加监听函数
@param {Function} $fire 手动触发监听函数
@param {Array} $skipArray 手动触发监听函数

@param {Function}  $getDefaultProps 添加默认配置项

@param ｛Object｝ $propTypes  验证属性
@param {String|Boolean} $hashcode 
@param {Object} $accessors 内部属性

@param {Function} $render 渲染函数

不再存在ms-controller，ms-important

减少创建一个vm的成本，直接将后端数据加点属性就可以用

```
avalon.define({
   $id: "test",
   firstName: "xxx",
   lastName: "yyy"
})
```
相当于

```
avalon.ready(function(){
var el = document.getElementById("test")
var tmpl = el.outerHTML
var vm = avalon.createComponet({
    $element: el,
    $render: toTemplate(tmpl)
    $id: "test",
    firstName: "xxx",
    lastName: "yyy",
    getWidthProps: function(){
       return avalon.getVmAccossors(vm)
    }
})
el.vm = avalon.vmodels.test = vm
vm.$fire("$init")
var vnode = vm.$render()
vnode.dispose = function(){
    vm.$fire("$disposed", el)
    el.vm = null  
}
avalon.patchUpdate([el],[vnode]) //在里面会触发 $scaned

})
```



[^watch]: 这是一个函数