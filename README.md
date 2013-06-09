
<h1>Avalon</h1>
<p>迷你简单易用的MVVM框架</p>
<hr>


<h3>优势</h3>
<ul>
    <li>使用简单，在HTML中添加绑定，在JS中用avalon.define定义ViewModel，再调用avalon.scan方法，它就能动了！</li>
    <li>兼容到IE6(其他mvvm框架， knockoutjs IE6, angularjs IE7, emberjs IE8, winJS IE9 )</li>
    <li>没有任何依赖，只有72K，压缩后22K</li>
    <li>支持管道符风格的过滤函数，方便格式化输出</li>
    <li>局部刷新的颗粒度已细化到一个文本节点，特性节点</li>
    <li>要操作的节点，在第一次扫描就与视图刷新函数相绑定，并缓存起来，因此没有选择器出场的余地。</li>
    <li>让DOM操作的代码近乎绝迹</li>
    <li>使用类似CSS的重叠覆盖机制，让各个ViewModel分区交替地渲染页面</li>
    <li>节点移除时，智能卸载对应的视图刷新函数，节约内存</li>
    <li>操作数据即操作DOM，对ViewModel的操作都会同步到View与Model去。</li>
</ul>

<p><a href="http://rubylouvre.github.io/mvvm/">官网地址</a></p>