<h1>Avalon</h1>
<p>迷你简单易用的MVVM框架</p>
<hr>


<h3>优势</h3>
<ul>
    <li>使用简单，在HTML中添加绑定，在JS中用avalon.define定义ViewModel，再调用avalon.scan方法，它就能动了！</li>
    <li>兼容到IE6(其他mvvm框架， knockoutjs IE6, angularjs IE7, emberjs IE8, winJS IE9 )</li>
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

<h2>Structure</h2>

<p><img src="http://rubylouvre.github.io/mvvm/images/architecture.jpg" /></p>
<ul>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.api.html">API文档</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.define.html">avalon.define</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.mix.html">avalon.mix</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.important.html">ms-important与ms-controller绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.class.html">ms-class、 ms-hover与ms-active绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.html.html">ms-text, ms-html, {{text}}与{{text|html}}</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.model.html">ms-model绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.css.html">ms-css绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.visible.html">ms-visible绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.include.html">ms-include绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.bind.html">ms-bind绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.watch.html">$watch方法</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.href.html">ms-href, ms-src, ms-alt, ms-title, ms-value绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.disabled.html">ms-disabled, ms-enabled, ms-readonly, ms-checked, ms-selected绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.data.html">ms-data绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.on.html">ms-on-*, ms-dblclick, ms-mouseout, ms-click, ms-mouseover等事件绑定</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.each.html">ms-each绑定</a></li>

    <li><a href="datepicker.html">日期选择器</a></li>
    <li><a href="todos.html">todos示例</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.router.html">avalon路由系统</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.switch.html">switch组件</a></li>
    <!--<li><a href="http://rubylouvre.github.io/mvvm/avalon.grid.html">grid组件</a></li>-->
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.slider.html">slider组件</a></li>
    <li><a href="http://rubylouvre.github.io/mvvm/avalon.draggable.html">ms-draggable绑定(以插件形式引入)</a></li>
</ul>

<p><a href="http://rubylouvre.github.io/mvvm/">官网地址</a></p>
