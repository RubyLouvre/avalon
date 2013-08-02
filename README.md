
<h1>Avalon</h1>
<p>迷你简单易用的MVVM框架</p>
<hr>
<ul>
    <li>avalon.js 兼容IE6，及标准浏览器</li>
    <li>avalon.mobile.js 则只支持IE10及其以上版本，及标准浏览器</li>
</ul>
<h3>优势</h3>
<ul>
    <li>使用简单，在HTML中添加绑定，在JS中用avalon.define定义ViewModel，再调用avalon.scan方法，它就能动了！</li>
    <li>兼容到IE6(其他mvvm框架， knockoutjs IE6, angularjs IE8, emberjs IE8, winJS IE9 )</li>
    <li>没有任何依赖，不到3000行，压缩后不到30KB</li>
    <li>支持管道符风格的过滤函数，方便格式化输出</li>
    <li>局部刷新的颗粒度已细化到一个文本节点，特性节点</li>
    <li>要操作的节点，在第一次扫描就与视图刷新函数相绑定，并缓存起来，因此没有选择器出场的余地。</li>
    <li>让DOM操作的代码近乎绝迹</li>
    <li>使用类似CSS的重叠覆盖机制，让各个ViewModel分区交替地渲染页面</li>
    <li>节点移除时，智能卸载对应的视图刷新函数，节约内存</li>
    <li>操作数据即操作DOM，对ViewModel的操作都会同步到View与Model去。</li>
    <li>自带模块加载系统，省得与其他加载器进行整合。</li>
</ul>
<p><a href="http://vdisk.weibo.com/s/aMO9PyIQCnLOF/1375154475">相关PPT下载</a></p>
<p><a href="http://rubylouvre.github.io/mvvm/">官网地址</a></p>
<p><a href="http://www.cnblogs.com/rubylouvre/p/3181291.html">入门教程</a></p>

```html
        <fieldset ms-controller="simple">
            <legend>例子</legend>
            <p>First name: <input ms-duplex="firstName" /></p>
            <p>Last name: <input ms-duplex="lastName"  /></p>
            <p>Hello,    <input ms-duplex="fullName"></p>
            <div>{{firstName +" | "+ lastName }}</div>

        </fieldset>
```
```javascript
avalon.ready(function() {
    avalon.define("simple", function(vm) {
        vm.firstName = "司徒"
        vm.lastName = "正美"
        vm.fullName = {//一个包含set或get的对象会被当成PropertyDescriptor，
            set: function(val) {//里面必须用this指向scope，不能使用scope
                var array = (val || "").split(" ");
                this.firstName = array[0] || "";
                this.lastName = array[1] || "";
            },
            get: function() {
                return this.firstName + " " + this.lastName;
            }
        }
    });
    avalon.scan()
})
```