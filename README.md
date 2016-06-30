#avalon 2 

avalon2是基于虚拟DOM的超高性能MVVM框架,兼容到IE6.


###[avalon2官网](http://avalonjs.coding.me/)

```javascript
npm install avalon2
```

### [avalon2 学习教程(包括组件)](https://segmentfault.com/u/situzhengmei/articles)

<img src='https://github.com/RubyLouvre/avalon/blob/master/structure.jpg' width=600 height=400/>

主要特征如下：
1. ms-*属性的行为全部统一

2. 使用虚拟DOM提高性能，确保更新是从上到下，从外到内，并且能准确知道渲染结束的时机，从而更好地支持扫描后的回调
    流程如下:
    
    ```
    el.outerHTML --> vtree1 --> render模板函数 --> vtree2 --> diff vtree2, vtree1 --> batch更新
    
    ````

3. 去掉html过滤，所有绑定属性支持过滤器

4. ms-duplex 拥有四个数据转换
<blockquote>
   ms-duplex-string  如果为null, undefined, 转换为'', 其他转字符串<br/>
   ms-duplex-number  如果元素的值为'',则为'',其他情况调用parseFloat, 若结果为NaN,转0<br/>
   ms-duplex-boolean 如果元素的值为'true'则转换为true,其他为false<br/>
   ms-duplex-checked 根据原来元素的checked属性取反
</blockquote>
   在其表达式后方的过滤器,除了change与debounce,都是用于格式化元素的值
   change过滤器, 用于延迟数据在元素失去焦点后才同步视图
   debounce(100)过滤器, 必须指定数字并大于4, 用于延迟n毫秒后才同步视图

   

5. 对数组元素的属性监听或子对象的属性监听更加完善 ($watch方法)

6. for指令取替旧的repeat指令, 使用ng－preatng-repeat="(k,v) in array"的风格. <br>

   for指令有两种形式
   
   ```javascript
   <div ms-for="el in @attr">{{el}}</div>
   <!--ms-for:el in @attr-->
   <div>{{el}}</div>
   <!--ms-for-end:-->

   ```
   上面的`@`符号是用来标识此变量或方法是来自vm的,此外为了防止与.NET的razor引擎相冲突,也可以使用`##`符合
   for指令拥有4个数组(或对象)过滤器(selectBy,orderBy,limitBy,filterBy) 

	+ selectBy(keyList)用于取代 data-with-sorted,从一个对象取得指定的属性值
	+ orderBy(key, -1或1)用于排序
	+ limitBy(limit, begin?)用于对字符串,数字或数组,进行slice操作
	+ filterBy(search)用于根据元素值或对象的键值是否包含search,进行过滤

7. 事件指令支持11个事件过滤器(stop, prevent, up,down,right, left, esc,tab, enter,space,del)
并且使用类似react的事件代理机制减少事件句柄,优化性能

8. 内置HTML parser,支持后端渲染
9. 添加 avalon.Array.merge方法
10.  去掉AMD内置加载器，建议使用webpack打包工程
11.  vm去掉对计算属性的支持
12.  添加`<!--js: code -->`指令，方便插入JS逻辑，实现定义中间变量（如计算属性）
13. avalon支持直接在IE6下使用`<ms-panel>`这样的自定义标签, <br>
    支持onInit, onReady, onViewChange, onDispose四个生命周期回调<br>
    支持传入$diff方法 实现react的shouldComponentUpdate功能<br/>
    支持<slot name='xx'></slot>这样的DOM插槽 机制<br/>
    支持组件套组件
14. 测试 karma start
15.  ms-important与ms-controller对应的vm.$id一个页面上只能用一次,不能存在多个同名的ms-controller.
     ms-important由于不继承上级的$element与$render,每次只更新它所在的区域,善用它能大大提高性能
```html
   <div ms-controller='test'>{{@aaa}}</div>
   <div ms-controller='test'>{{@bbb}}<!--test已经使用了1次!会导致程序出错--></div>
   <div ms-important='test'>{{@bbb}}<!--test已经使用了2次!会导致程序出错--></div>
```
