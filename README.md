#avalon 2 

基于avalon1.6内部版本研发出来，对早期版本不兼容

主要特征如下：

1. 添加新的av-前缀，也兼容旧的ms-前缀

2. 使用虚拟DOM提高性能，确保更新是从上到下，从外到内，并且能准确知道渲染结束的时机，从而更好地支持扫描后的回调
    流程如下:
    
    ```
    el.outerHTML --> vtree1 --> render模板函数 --> vtree2 --> diff vtree2, vtree1 --> batch更新
    
    ````

3. 去掉html过滤，所有绑定属性支持过滤器

4. ms-duplex的拦截器改成rivetsjs的那种双向过滤器

	+ string  原来的string拦截器
	+ number  原来的number拦截器
	+ boolean 原来的boolean拦截器
	+ checked 原来的checked拦截器
	+ change  原来的data-duplex-event="change"辅助指令

5. 对数组元素的属性监听或子对象的属性监听更加完善 ($watch方法)

6. for指令取替旧的repeat指令, 使用ng－preatng-repeat="(k,v) in array"的风格. <br>

   for指令有两种形式
   
   ```javascript
   <div av-for="el in @attr">{{el}}</div>
   <!--av-for:el in @attr-->
   <div>{{el}}</div>
   <!--av-for-end:-->

   ```
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
