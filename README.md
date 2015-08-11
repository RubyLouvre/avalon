# Avalon

A lightweight,high-performance and easy-to-learn JavaScript MVVM framework

* Avalon now has 3 versions: `avalon.js` for IE6+ and modern browsers (including Webkit/Chromium based browsers), `avalon.modern.js` for IE10+ and HTML5 standard browsers and `avalon.mobile.js`, which added `Touch Event`, `Pointer Event` and `fastclick` support for mobile devices. For requirejs or AMD-like loader, use the corresponding shim version.
* The component libraries are now maintained by [Qunar UED(Chinese page)](http://ued.qunar.com/). First here are the three pillars: 1. [mmRouter](https://github.com/RubyLouvre/mmRouter) for router, 2. [mmAnimate](https://github.com/RubyLouvre/mmAnimate) for animation, 3. [mmRequest](https://github.com/RubyLouvre/mmRequest) for AJAX utils; and the UI component OniUI, you can check it out [at here](https://github.com/RubyLouvre/avalon.oniui)
* The test cases are in an individual repository: [avalon.test](https://github.com/RubyLouvre/avalon.test)

## HomePage
  [http://avalonjs.github.io/](http://avalonjs.github.io/)

  [Fork it](https://github.com/avalonjs/avalonjs.github.io)
##nuget  
  [nuget](https://www.nuget.org/packages/avalon/1.45.0)
  

##Loader
Avalon uses a AMD-style loader. If you like Node.js's CommonJS loader, you can use [this tools](https://github.com/ilife5/cat) this tool </a> 
to converts AMD to CommonJS.
 
## Advantages

    One absolute advantage is that the framework eliminates
    couplings and frees developers from varies of
    complex event handling.

    For example, one state could be effected by the order 
    of several events and their additional arguments, making the 
    logic extremely complex and fragile without using MVC 
    (including MVVM) framework and might usually maintain lots of 
    mutuality logics which can easily cause bugs at the same time.

    By using these sort of framework, one can totally reduce the 
    difficulty of app development, and make the code more robust.

    Besides, it also frees developers from the repeated tasks,
    like `{value}` directive can simply replace 
    `$(selector).text(value)`, what's more, some common directive
    can also implement some logics swiftly.

Here are some of the benefits:

* Easy to use. Just add binding code in HTML, then define ViewModels in JavaScript code, finally invoke `avalon.scan()`, enjoy!
* Compatible with IE6+ (*Very Important* in China at present / Others: KnockoutJS(IE6+), AngularJS(IE9+), EmberJS(IE8+), WinJS(IE9+)), For more efficient and edge developers, use: `avalon.modern`.
* No dependencies, less than 5000 lines of code and at 50KiB size of compressed code.
* Support filter function using pipe symbol `|`, easy for output formatting.
* Partial refreshing are accurated to every text/attribute node.
* No need to use selector, as the node to manipulate has all been binded and cached to the view refreshing function at the initial scanning procedure.
* You need to write DOM manipulation code slightly, either.
* By using cascading render mechanism like CSS, ViewModels can render their views alternately.
* While removing the node, the framework can detach the watching function of the corresponding views, reducing memory usage.
* *Data Manipulation as DOM Manipulation*, actions on ViewModels will all be synchronized to the relevant Views and Models.
* Ships with a built-in AMD loader.

## To compress JavaScript files, run:

```sh
java -jar compiler.jar --js avalon.js --js_output_file avalon.min.js
java -jar compiler.jar --js avalon.modern.js --js_output_file avalon.modern.min.js
java -jar compiler.jar --js avalon.mobile.js --js_output_file avalon.mobile.min.js
```

Demo:

```html
<!DOCTYPE html>
<html>
    <head>
        <title>avalon 101</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <script src="avalon.js" ></script>
        <script>
            var first = 0;
            var model = avalon.define({
                $id: "test",
                firstName: "John",
                lastName: "Smith",
                fullName: {//a object that contain set/get will be treated as an `PropertyDescriptor`,
                    set: function(val) {//must use `this` to refer `scope` instead of using `scope` directly 
                        var array = (val || "").split(" ");
                        this.firstName = array[0] || "";
                        this.lastName = array[1] || "";
                    },
                    get: function() {
                        return this.firstName + " " + this.lastName;
                    }
                },
                arr: ["aaa", "bbb", "ccc", "ddd"],
                selected: ["bbb", "ccc"],
                checkAllbool: false,
                checkAll: function() {
                    if (!first) {
                        first++
                        return
                    }
                    if (this.checked) {
                        model.selected = model.arr
                    } else {
                        model.selected.clear()
                    }
                },
                checkOne: function() {
                    var bool = this.checked
                    if (!bool) {
                        model.checkAllbool = false
                    } else {
                        model.checkAllbool = model.selected.size() === model.arr.length
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
            <div>{{firstName}} | {{lastName}}</div>
            <ul>
                <li><input type="checkbox" ms-duplex-checked="checkAllbool"  data-duplex-changed="checkAll"/>Select All</li>
                <li ms-repeat="arr" ><input type="checkbox" ms-attr-value="el" ms-duplex="selected" data-duplex-changed="checkOne"/>{{el}}</li>
            </ul>
        </div>

    </body>
</html>
```

More examples are at [here](https://github.com/RubyLouvre/avalon/tree/master/examples).

The code structure of the source code are listed here, from top to bottom:

* global vars and methods
* the static member methods of avalon (mainly util functions)
* JavaScript polyfills
* DOM polyfills
* configuration system
* event bus
* the ViewModel factory (modelFactory)
* watch collection factory (Collection)
* dependency dispatcher system (dispatcher)
* manipulation functions of tags (parseHTML, innerHTML, clearHTML)
* scan system
* the prototype methods definiton of avalon (mainly related to DOM manipulation)
* directive definiton
* compile system
* builtin filters
* AMD Loader
* DOMReady

--------------------------------------------------

# Avalon

迷你简单易用的MVVM框架

前端做久了就会发现HTML(DOM)才是所有前端的真正精髓汇聚地。不管JS和CSS都是为DOM服务的。但是DOM遍布荆棘与陷阱，因此才出现像jQuery那样专门为它填坑的库，
当下的前端开发就是一边填坑一边写业务中进行。avalon的诞生改变了这一切，让我们摆脱DOM的掣肘，专注于需求本身，将可变的数据与操作数据的方法封装成模型。
在更高的层次上组织代码，提高软件的可维护性，可扩展性和可重用性。

* * *

*  [avalon](https://github.com/RubyLouvre/avalon)现在有三个分支:avalon.js 兼容IE6，标准浏览器, 及主流山寨浏览器(QQ, 猎豹, 搜狗, 360, 傲游);
avalon.modern.js 则只支持IE10等支持HTML5现代浏览器 ;
avalon.mobile.js，添加了触屏事件与fastclick支持，用于移动端；
如果使用requirejs或其它amd加载器（非avalon自带的amd加载器），使用对应的shim版本。shim版本去除了avalon自带amd加载器代码。
*  [avalon](https://github.com/RubyLouvre/avalon)拥有强大的组件库，现在由去哪儿网前端架构组在维护与升级，[这里](http://ued.qunar.com/)；首先是三柱臣，想使用路由器，可以用[mmRouter](https://github.com/RubyLouvre/mmRouter)， 想使用动画，可以用[mmAnimate](https://github.com/RubyLouvre/mmAnimate)， 想使用AJAX，可以用[mmRequest](https://github.com/RubyLouvre/mmRequest)； 其次是[OniUI](https://github.com/RubyLouvre/avalon.oniui)，树组件差不多开发完毕，届时就有一个拥有2个Grid，1个树，1 个验证插件等总数近50个UI组件的库了。
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
*  [avalon新官网](http://avalonjs.github.io/)
*  [avalon-learning](http://limodou.github.io/avalon-learning/zh_CN/index.html)
*  [入门教程](http://www.cnblogs.com/rubylouvre/p/3181291.html)
*  [HTML5交流会有关avalon的PPT](http://vdisk.weibo.com/s/aMO9PyIQCnLOF/1375154475)
*  [avalon最佳实践](http://www.cnblogs.com/rubylouvre/p/3385373.html)
*  [《avalon探索之旅》系列视频教程](http://edu.51cto.com/course/course_id-2533-page-1.html)

### 运行github中的示例

将项目下载到本地，里面有一个叫server.exe的.Net小型服务器（可能需要安装[.Net4.0](http://dl.pconline.com.cn/download/54972.html)才能运行），
点击它然后打开里面与index开头的HTML文件，一边看运行效果，一边看源码进行学习。

![](https://raw.github.com/RubyLouvre/avalon/master/examples/images/example.jpg)

###加载器
avalon是使用自带AMD式加载器,如果你喜欢Node.js那种CommonJS风格加载器,你可以用[这个工具](https://github.com/ilife5/cat)进行转换。

### JS文件的压缩
```
java -jar compiler.jar --js avalon.js --js_output_file avalon.min.js
java -jar compiler.jar --js avalon.modern.js --js_output_file avalon.modern.min.js
java -jar compiler.jar --js avalon.mobile.js --js_output_file avalon.mobile.min.js

```
大家也可以在[新浪微博](http://huati.weibo.com/k/avalon%E5%BF%AB%E6%8A%A5?from=501&order=time)第一时间了解它的变更或各种秘笈分享！


```html
<!DOCTYPE html>
<html>
    <head>
        <title>avalon 101</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <script src="avalon.js" ></script>
        <script>
            var first = 0;
            var model = avalon.define({
                $id: "test",
                firstName: "司徒",
                lastName: "正美",
                fullName: {//一个包含set或get的对象会被当成PropertyDescriptor,
                    set: function(val) {//m里面必须用this指向scope，不能使用scope 
                        var array = (val || "").split(" ");
                        this.firstName = array[0] || "";
                        this.lastName = array[1] || "";
                    },
                    get: function() {
                        return this.firstName + " " + this.lastName;
                    }
                },
                arr: ["aaa", "bbb", "ccc", "ddd"],
                selected: ["bbb", "ccc"],
                checkAllbool: false,
                checkAll: function() {
                    if (!first) {
                        first++
                        return
                    }
                    if (this.checked) {
                        model.selected = model.arr
                    } else {
                        model.selected.clear()
                    }
                },
                checkOne: function() {
                    var bool = this.checked
                    if (!bool) {
                        model.checkAllbool = false
                    } else {
                        model.checkAllbool = model.selected.size() === model.arr.length
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
            <div>{{firstName}} | {{lastName}}</div>
            <ul>
                <li><input type="checkbox" ms-duplex-checked="checkAllbool"  data-duplex-changed="checkAll"/>Select All</li>
                <li ms-repeat="arr" ><input type="checkbox" ms-attr-value="el" ms-duplex="selected" data-duplex-changed="checkOne"/>{{el}}</li>
            </ul>
        </div>

    </body>
</html>
```
### 源码内部的模块划分

从上至下，依次是

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

### LOGO来历

http://tieba.baidu.com/p/1350048586
<pre>
MVVM最先使用是在WPF，对于微软来说是从WinForm的MVP和其余的MVC衍生而来，
比MVP/MVC做到更多的就是数据的Binding，
使得数据的变化能即时以增量的形式反馈到View上。
同理的实现好像还有iOS delegate，为MVC提供类似binding的Publish/Subscribe功能
</pre>
