2016.9.11 重构的版本

添加依赖检测机制, 通过addDir与matchPaths方法,动态为元素添加指令与dynamic对象

从而减少求值函数的执行与diff的数量 

![](./strategy.png)