Avalon 1.5
=======================
avalon 1.4的升级版，添加了大量特性

添加avalon.directive方法，方便自定义指令
添加avalon.component方法，方便自定义组件
添加avalon.effect与ms-effect，实现对动画的支持
实现对子属性及数组元素的深层监控
去除对旧风格的支持，直接导致无法支持oinui,启用新的UI库,avalon.bootstrap
默认开启异步刷新视图，当然也可以使用avalon.config({async: false})，保证与1.4的行为一致
计算属性被集中到$computed对象中定义
其具体使用详见avalon官网

以下为更新日志


#avalon1.5.6
1. 添加扫描后的回调
   在目标DIV加上ms-controller="test", $id为test的VM监听一个"ms-scan-end"回调
```
vm.$watch("ms-scan-end", function(div){
   //div为绑定的元素
})
```

#avalon1.5.5
1. 终于比较完美地解决光标问题
2. fix data-duplex-changed执行两次的BUG
3. 启动全新的UI库 [avalon.bootstrap](https://github.com/RubyLouvre/avalon.bootstrap) 欢迎大家踊跃参与
4. fix IE下onchange与oninput无法共存的BUG
5. 以 component组件进行增强,现在支持对on-xxx属性在vmodels查找回调的功能


#avalon1.5.4(新touch模块)

1. 修正oldAccessors BUG https://github.com/RubyLouvre/avalon/issues/1091
2. 修正当一个元素存在多个ms-if绑定时,由于注释节点不能提供pos,导致显示不正确 https://github.com/RubyLouvre/avalon/issues/1088
3. 新的触屏模块
4. 重构duplex指令 (包括添加msFocus属性,对validation指令的支持,data-duplex-changed回调的修复)
5. loader模块分离得更干净
6. 修正include指令在不与动画指令配合使用时,data-include-replace辅助指令失效的BUG
7. fix avalon.modern下的ms-duplex-checked BUG
8. fix ready模块对loader模块的innerRequire的依赖


#avalon1.5.3(各种奇葩BUG修复及更快的parser)

1. 全新的parser
2. 修正$watch的监控
3. fix 使用数组clear方法清空数组后，再push元素报错
4. fix ms-duplex在modern版本的错误
5. fix uuid引发的错误 https://github.com/RubyLouvre/avalon/issues/1060
6. 将所有编译函数的地方抽象成一个方法cspCompile https://github.com/RubyLouvre/avalon2/commit/4169422645466d0f036aa7ad48e1b9dd6c874106
7. fix toJson在IE6的BUG https://github.com/RubyLouvre/avalon/issues/1063
8. fix avalon(window).width()在IE6下 取值不正确的BUG



#avalon1.5.2(主要在自定义标签上进行简化)

1. configs 改名为 config
2. $extends  改名为 $extend
3. fix loader不能正确处理url path map之后带query的BUG
4. fix ms-if 与 HTML5 form validation共用时的BUG
5. fix $watch回调this指向BUG
6. fix ms-if 碰到子对象的属性不存在时不插入节点的 BUG
7. fix ms-include不存在动画时不会移除旧节点的BUG

#avalon1.5.1
1. 精简自定义标签的设计
2. fix cache内存泄漏
3. 添加$fire("all!xxx")的支持
4. fix ms-duplex使用拦截器时触发多次的BUG
5. 公开openTag, closeTag到avalon.config


# avalon1.5.0

1. 添加动画指令 ms-effect avalon.effect http://avalonjs.github.io/#zh/bindings/effect.html
2. 添加基于自定义标签的组件指令 http://avalonjs.github.io/#zh/bindings/component.html
3. 全新的$watch机制   http://avalonjs.github.io/#zh/concepts/$watch.html
4. 计算属性全部移动$computed对象上集中定义
5. 更优雅便捷地自定义组件  http://avalonjs.github.io/#zh/bindings/directive.html
6. 废掉avalon.define的旧风格定义,只支持新风格
7. 废掉data-duplex-observe辅助指令
8. 废掉ms-widget 详看component/pager/avalon.pager.js 是怎么将原来组件改成新组件的

现在的VM只有第一层上拥有$events, $fire, $watch, $model属性与方法, 它的子对象没有这些属性


