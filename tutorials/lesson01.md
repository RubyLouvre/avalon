#预览
##overview

avalon是一个来自中国的MVVM框架，以良好的浏览器兼容性著称，体积少，性能卓越，简单易用，支持后端渲染，能帮大家快速搞定高度交互的页面。

Avalon is a MVVM framework from China, known for good browser compatibility, small size, high-performance, ease of use, support server rendering, can help you quickly to build the rich Interactive pages.

```javascript
avalon.define({
   $id: "test",
   aaa: "avalon",
   bbb: "阿瓦隆"
})
```

```html
 <div ms-controller="test">
     <h1>{{@aaa}}</h1>
     <h2>{{@bbb}}</h2>
 </div>
```

avalon 把我们的前端代码分为两部分，VM与视图。VM位于JS文件里，用于操作视图的改变。 视图位于html文件里，用于响应JS的改动或用户的操作。 视图被avalon划分为一个个区域，每一个区域添加上ms-controller，它们对应JS中的VM。 当VM的$id等于ms-controller的值，这个区域就交由这个VM来渲染。

Avalon divides our front-end code into two parts, VM and View. The VM is located in the JS file, used to change the view, The View is located in the HTML file, used to respond to changes in the JS and the user's operation. The Views are divided into some  areas by Avalon, each of which is added on the "ms-controller" attributes, which corresponds to the VM in the JS. When the $id of the VM equals ms-controller, this area is rendered by this VM

![](lesson01_1.png)

如果你不想这个区域被VM处理，可以使用ms-skip属性，让avalon忽略这个元素及它的后代们

If you don't want this area to be processed by VM, you can use the ms-skip attribute to let avalon ignore the element and its descendants.

大家可以打开chrome控制台，修改VM的属性，观察视图对应文字的变化，感受一下这种魔幻效果

You can open the chrome console, modify the properties of VM, observe the changes in the corresponding text, feel this magic!

npm install avalon2

![](./lesson01_0.gif)

[index](./index.md)

[next](./lesson02.md)