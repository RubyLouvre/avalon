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
前者直接修改了，store.dispatch ，很难找回最初那一个
每个中间件都无法跳过后面的中间件，直接调用最初的 store.dispatch

redux 的 applyMiddleWares 能拿到 store 和 next ，从 store 里拿最初的 dispatch ，从 next 里调用后面的中间件，更灵活

而且中间件的 store 参数，也只是真正的 store 里拿出几个字段 getState dispatch 构造的新对象，真正的 store 保持  immutable 特征
现在 redux 在讨论简化 api ，现在的中文文档，不知道是否过时了……
Redux 的中间件角色很清晰，就是用来处理各类非 plain object 的 action 参数，转化为格式正确的 action 传递给最初的 store.dispatch
redux-thunk 处理 function 类型的 action，redux-promise 处理 thenable 类型的 action ，还可以制定其他中间件，拓展 dispatch 的参数类型范围


[^watch]: 这是一个函数