#avalon1.5.1
1. 精简自定义标签的设计
2. fix cache内存泄漏
3. 添加$fire("all!xxx")的支持
4. fix ms-duplex使用拦截器时触发多次的BUG
5. 公开openTag, closeTag到avalon.config


# avalon1.5

1. 添加动画指令 ms-effect avalon.effect http://avalonjs.github.io/#zh/bindings/effect.html
2. 添加基于自定义标签的组件指令 http://avalonjs.github.io/#zh/bindings/component.html
3. 全新的$watch机制   http://avalonjs.github.io/#zh/concepts/$watch.html
4. 计算属性全部移动$computed对象上集中定义
5. 更优雅便捷地自定义组件  http://avalonjs.github.io/#zh/bindings/directive.html
6. 废掉avalon.define的旧风格定义,只支持新风格
7. 废掉data-duplex-observe辅助指令
8. 废掉ms-widget 详看component/pager/avalon.pager.js 是怎么将原来组件改成新组件的

现在的VM只有第一层上拥有$events, $fire, $watch, $model属性与方法, 它的子对象没有这些属性
