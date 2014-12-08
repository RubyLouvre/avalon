
<h1>Avalon</h1>
<p>迷你简单易用的MVVM框架</p>
<p>前端做久了就会发现HTML(DOM)才是所有前端的真正精髓汇聚地。不管JS和CSS都是为DOM服务的。但是DOM遍布荆棘与陷阱，因此才出现像jQuery那样专门为它填坑的库，
当下的前端开发就是一边填坑一边写业务中进行。avalon的诞生改变了这一切，让我们摆脱DOM的掣肘，专注于需求本身，将可变的数据与操作数据的方法封装成模型。
在更高的层次上组织代码，提高软件的可维护性，可扩展性和可重用性。</p>
<hr>

*  [avalon](https://github.com/RubyLouvre/avalon)现在有三个分支:avalon.js 兼容IE6，及标准浏览器;avalon.modern.js 则只支持IE10及其以上版本，及标准浏览器,主流山寨浏览器(QQ, 猎豹, 搜狗, 360, 傲游) ;avalon.observe是用于研究es6的新特性，使用Object.observe实现的；
*  [avalon](https://github.com/RubyLouvre/avalon)拥有强大的组件库，现在由去哪儿网前端架构组在维护与升级，[这里](http://ued.qunar.com/)；首先是三柱臣，想使用路由器，可以用[mmRouter](https://github.com/RubyLouvre/mmRouter)， 想使用动画，可以用[mmAnimate](https://github.com/RubyLouvre/mmAnimate)， 想使用AJAX，可以用[mmRequest](https://github.com/RubyLouvre/mmRequest)； 其是是OniUI，树组件差不多开发完毕，届时就有一个拥有2个Grid，1个树，1 个验证插件等总数近50个UI组件的库了。
* avalon的测试比较庞大，放在独立的仓库中——[avalon.test](https://github.com/RubyLouvre/avalon.test)

优势
======
```
绝对的优势就是降低了耦合, 让开发者从复杂的各种事件中挣脱出来. 举一个简单地例子, 
同一个状态可能跟若干个事件的发生顺序与发生时的附加参数都有关系, 
不用 MVC (包括 MVVM) 的情况下, 逻辑可能非常复杂而且脆弱. 
并且通常需要在不同的地方维护相关度非常高的一些逻辑, 
稍有疏忽就会酿成 bug 不能自拔. 使用这类框架能从根本上降低应用开发的逻辑难度, 并且让应用更稳健.

除此之外, 也免去了一些重复的体力劳动, 一个 {value} 就代替了一行 $(selector).text(value),
一些个常用的 directive 也能快速实现一些原本可能需要较多代码才能实现的功能
```
* 使用简单，在HTML中添加绑定，在JS中用avalon.define定义ViewModel，再调用avalon.scan方法，它就能动了！
* 兼容到 **IE6** (其他MVVM框架，KnockoutJS(IE6), AngularJS(IE9), EmberJS(IE8), WinJS(IE9) )，另有avalon.mobile，它可以更高效地运行于IE10等新版本浏览器中
* 没有任何依赖，不到5000行，压缩后不到50KiB
* 支持管道符风格的过滤函数，方便格式化输出
* 局部刷新的颗粒度已细化到一个文本节点，特性节点
* 要操作的节点，在第一次扫描就与视图刷新函数相绑定，并缓存起来，因此没有选择器出场的余地。
* 让DOM操作的代码近乎绝迹
* 使用类似CSS的重叠覆盖机制，让各个ViewModel分区交替地渲染页面
* 节点移除时，智能卸载对应的视图刷新函数，节约内存
* **操作数据即操作DOM**，对ViewModel的操作都会同步到View与Model去
* 自带AMD模块加载器，省得与其他加载器进行整合

学习教程
======
*  [avalon学习教程](http://www.html-js.com/article/column/234)
*  [avalon api大全](http://ued.qunar.com/oniui/index.html#pages/apis/index.html)
*  [avalon-learning](http://limodou.github.io/avalon-learning/zh_CN/index.html)
*  [入门教程](http://www.cnblogs.com/rubylouvre/p/3181291.html)
*  [HTML5交流会有关avalon的PPT](http://vdisk.weibo.com/s/aMO9PyIQCnLOF/1375154475)
*  [avalon最佳实践](http://www.cnblogs.com/rubylouvre/p/3385373.html)
*  [《avalon探索之旅》系列视频教程](http://v.qq.com/search.html?pagetype=3&stj2=search.search&stag=txt.index&ms_key=Avalon%E6%8E%A2%E7%B4%A2%E4%B9%8B%E6%97%85)


运行github中的示例
=====
将项目下载到本地，里面有一个叫server.exe的.Net小型服务器（可以需要安装[.Net4.0](http://dl.pconline.com.cn/download/54972.html)），
点击它然后打开里面与index开头的HTML文件，一边看运行效果，一边看源码进行学习。
![Alt text](https://raw.github.com/RubyLouvre/avalon/master/examples/images/example.jpg)

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
- avalon的静态成员定义区（主要是工具函数）
- JavaScript 底层补丁
- DOM        底层补丁
- 配置系统
- 事件总线
- VM工厂（modelFactory）
- 监控数组工厂(Collection)
- 依赖调度系统(dispatcher)
- 标签处理(parseHTML, innerHTML, clearHTML)
- 扫描系统
- avalon的原型方法定义区（主要是DOM处理）
- 指令定义区
- 编译系统
- 自带过滤器
- AMD加载器
- DOMReady

<h3>LOGO来历</h3>

http://tieba.baidu.com/p/1350048586
