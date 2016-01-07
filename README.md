#avalon1.6

VM只用于发指令
渲染DOM,使用纯数据
使用虚拟DOM进行优化

去掉html过滤，
所有绑定属性支持过滤器，
更好的支持扫描后的回调，

ms-duplex的拦截器改成rivetsjs的那种双向过滤器，

更好的基于频率的垃圾回收机制


添加4个数组过滤器(selectBy,orderBy,limitBy,filterBy)

selectBy(keyList)用于取代 data-with-sorted,从一个对象取得指定的属性值
orderBy(key, -1或1)用于排序
limitBy(limit, begin?)用于对字符串,数字或数组,进行slice操作
filterBy(search)用于根据元素值或对象的键值是否包含search,进行过滤


11个事件过滤器(stop, prevent, up,down,right, left, esc,tab, enter,space,del)