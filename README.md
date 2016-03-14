# Avalon 1.5
avalon 1.4的升级版，添加了大量特性



1.  添加avalon.directive方法，方便自定义指令
2.  添加avalon.component方法，方便自定义组件
3.  添加avalon.effect与ms-effect，实现对动画的支持
4.  实现对子属性及数组元素的深层监控
5.  去除对旧风格的支持，直接导致无法支持[oinui](http://ued.qunar.com/oniui/home.htm),启用新的UI库,[avalon.bootstrap](https://github.com/RubyLouvre/avalon.bootstrap)
6.  默认开启异步刷新视图，当然也可以使用avalon.config({async: false})，保证与1.4的行为一致
7.  计算属性被集中到$computed对象中定义


其具体使用详见[avalon官网](http://avalonjs.github.io/)

