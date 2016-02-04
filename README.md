#avalon1.6

添加虚拟DOM中间层,确保更新是从上到下,从外到内.并且能准确知道渲染结束的时机,
从而更好的支持扫描后的回调

去掉html过滤，所有绑定属性支持过滤器

ms-duplex的拦截器改成rivetsjs的那种双向过滤器

+ string  原来的string拦截器
+ numeric 原来的number拦截器
+ boolean 原来的boolean拦截器
+ checked 原来的checked拦截器
+ change  原来的data-duplex-event="change"辅助指令

更好的基于频率的垃圾回收机制(已经应用到1.4,1.5)

对数组元素的属性监听或子对象的属性监听更加完善 ($watch方法)

repeat指令更加强大,也支持ng-repeat="(k,v) in array"的风格,重要的是它更快,
并能准备预测其渲染结束时间

repeat指令拥有4个数组(或对象)过滤器(selectBy,orderBy,limitBy,filterBy)

+ selectBy(keyList)用于取代 data-with-sorted,从一个对象取得指定的属性值
+ orderBy(key, -1或1)用于排序
+ limitBy(limit, begin?)用于对字符串,数字或数组,进行slice操作
+ filterBy(search)用于根据元素值或对象的键值是否包含search,进行过滤

事件指令支持11个事件过滤器(stop, prevent, up,down,right, left, esc,tab, enter,space,del)
并且使用类似react的事件代理机制减少事件句柄,优化性能

内置HTML parser,方便日后的后端渲染