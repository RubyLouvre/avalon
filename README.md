
<h1>Avalon</h1>
<p>迷你简单易用的MVVM框架</p>
<p>前端做久了就会发现HTML(DOM)才是所有前端的真正精髓汇聚地。不管JS和CSS都是为DOM服务的。但是DOM遍布荆棘与陷阱，因此才出现像jQuery那样专门为它填坑的库，
当下的前端开发就是一边填坑一边写业务中进行。avalon的诞生改变了这一切，让我们摆脱DOM的掣肘，专注于需求本身，将可变的数据与操作数据的方法封装成模型。
在更高的层次上组织代码，提高软件的可维护性，可扩展性和可重用性。</p>
<hr>
<ul>
    <li>avalon.js 兼容IE6，及标准浏览器</li>
    <li>avalon.modern.js 则只支持IE10及其以上版本，及标准浏览器,主流山寨浏览器(QQ, 猎豹, 搜狗, 360, 傲游)</li>
    <li>如果想支持触摸屏，请把mobile.js的源码拷贝到avalon.modern.js最后一个})之前，要不会报"Uncaught ReferenceError: W3CFire is not defined mobile.js:313"错误</li>
    <li>想使用路由器，可以用<a href="https://github.com/RubyLouvre/mmRouter">mmRouter</a>，
想使用动画，可以用<a href="https://github.com/RubyLouvre/mmAnimate">mmAnimate</a>，
想使用AJAX，可以用<a href="https://github.com/RubyLouvre/mmRequest">mmRequest</a>，
想使用各种控件库，可以用<a href="http://hotelued.qunar.com/">去哪儿网前端架构组搞的OniUI库</a>

    </li>
    <li>avalon的测试比较庞大，放在独立的仓库中——<a href="https://github.com/RubyLouvre/avalon.test">avalon.test</a>
    </li>
</ul>
<h3>优势</h3>
<ul>
    <li>使用简单，在HTML中添加绑定，在JS中用avalon.define定义ViewModel，再调用avalon.scan方法，它就能动了！</li>
    <li>兼容到IE6(其他MVVM框架，KnockoutJS(IE6), AngularJS(IE9), EmberJS(IE8), WinJS(IE9) )，另有avalon.mobile，它可以更高效地运行于IE10等新版本浏览器中</li>
    <li>没有任何依赖，不到4000行，压缩后不到50KiB</li>
    <li>支持管道符风格的过滤函数，方便格式化输出</li>
    <li>局部刷新的颗粒度已细化到一个文本节点，特性节点</li>
    <li>要操作的节点，在第一次扫描就与视图刷新函数相绑定，并缓存起来，因此没有选择器出场的余地。</li>
    <li>让DOM操作的代码近乎绝迹</li>
    <li>使用类似CSS的重叠覆盖机制，让各个ViewModel分区交替地渲染页面</li>
    <li>节点移除时，智能卸载对应的视图刷新函数，节约内存</li>
    <li><strong>操作数据即操作DOM</strong>，对ViewModel的操作都会同步到View与Model去。</li>
    <li>自带AMD模块加载器，省得与其他加载器进行整合。</li>
</ul>
<div><img src="https://raw2.github.com/RubyLouvre/avalon/master/examples/images/ecosphere.jpg" width="400" height="640"></div>
<h3>学习教程</h3>
<p><a href="http://www.html-js.com/article/column/234"> avalon学习教程</a></p>
<p>其他教程: <a href="http://limodou.github.io/avalon-learning/zh_CN/index.html">《avalon-learning 教程》</a>→<a href="http://www.cnblogs.com/rubylouvre/p/3181291.html">《入门教程》</a>→
<a href="http://vdisk.weibo.com/s/aMO9PyIQCnLOF/1375154475">HTML5交流会有关avalon的PPT</a>→<a href="http://www.cnblogs.com/rubylouvre/p/3385373.html">《avalon最佳实践》</a>
</p>
<h3>运行github中的示例</h3>
<p>将项目下载到本地，里面有一个叫server.exe的.Net小型服务器（可以需要安装<a href="http://dl.pconline.com.cn/download/54972.html">.Net4.0</a>才能运行），
点击它然后打开里面与index开头的HTML文件，一边看运行效果，一边看源码进行学习。</p>
<p><img src="https://raw.github.com/RubyLouvre/avalon/master/examples/images/example.jpg"/></p>
<h3>JS文件的压缩</h3>
```
java -jar compiler.jar --js avalon.js --js_output_file avalon.min.js
java -jar compiler.jar --js avalon.modern.js --js_output_file avalon.modern.min.js
```
<p>大家也可以在<a href="http://huati.weibo.com/k/avalon%E5%BF%AB%E6%8A%A5?from=501&order=time">新浪微博</a>第一时间了解它的变更或各种秘笈分享！</p>



```html
<!DOCTYPE html>
<html>
    <head>
        <title>avalon入门</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <script src="avalon.js" ></script>
        <script>
            var first = 0;
            var model = avalon.define("test", function(vm) {
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
                vm.arr = ["aaa", 'bbb', "ccc", "ddd"]
                vm.selected = ["bbb", "ccc"]
                vm.checkAllbool = false
                vm.checkAll = function() {
                    if (!first) {
                        first++
                        return
                    }
                    if (this.checked) {
                        vm.selected = vm.arr
                    } else {
                        vm.selected.clear()
                    }
                }
                vm.checkOne = function() {
                    var bool = this.checked
                    if (!bool) {
                        vm.checkAllbool = false
                    } else {
                        vm.checkAllbool = vm.selected.size() === vm.arr.length
                    }
                }
            })

        </script> 
    </head>
    <body>
        <div ms-controller="test">
            <p>First name: <input ms-duplex="firstName" /></p>
            <p>Last name: <input ms-duplex="lastName"  /></p>
            <p>Hello,    <input ms-duplex="fullName"></p>
            <div>{{firstName +" | "+ lastName }}</div>
            <ul>
                <li><input type="checkbox" ms-duplex-radio="checkAllbool"  data-duplex-changed="checkAll"/>全选</li>
                <li ms-repeat="arr" ><input type="checkbox" ms-value="el" ms-duplex="selected" data-duplex-changed="checkOne"/>{{el}}</li>
            </ul>
        </div>

    </body>
</html>
```
<h3>源码内部的模块划分</h3>
<p>从上至下，依次是</p>
- 全局变量及方法
- avalon的静态方法定义区
- modelFactory
- JavaScript 底层补丁  
- DOM 底层补丁    
- 配置系统
- avalon的原型方法定义区
- HTML处理(parseHTML, innerHTML, clearHTML)  
- 自定义事件系统
- 依赖调度系统  
- 扫描系统
- 编译系统
- 绑定处理系统
- 监控数组
- 自带过滤器 
- AMD加载器
- DOMReady
