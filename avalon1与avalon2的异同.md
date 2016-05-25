avalon1与avalon2的异同
================

| 科题         | avalon1              | avalon2  |
| :-------------: |:-----------------| :-----|
| 如何得知某个属性被改动       | 使用VBScript,Object.defineProperty实现对＝号的重写        | 在此基础增加Proxy的魔术监听 |
| 如何更新视图     | 找到变动属性对应的订阅者数组，执行这些数组元素的update方法    | 使用vm.$render生成虚拟DOM树，diff,从上到下有序更新 |
| 计算属性       |  支持           | 移除，使用js指令实现相同功能 |
| 绑定属性的处理   | 扫描后删除           | 扫描后还留着|
| 循环指令      | ms-repeat,ms-each,ms-with   | ms-for |
| 循环指令的语法      | ms-repeat-el='array'    | ms-for="el in @array" |
| 如何辩别指令中的vm属性    | avalon自行进行语法抽取    | 强制在前面带@或##符号 |
| 垃圾回收    | 密封舱机制，负责清空订阅者数组  | 由于不保存绑定对象，没有CG的烦恼 |
| 性能   | 一般，但能撑起上万个指令，瓶颈取决于绑定对象的所占内存|   原来的5倍以上，瓶颈取决于虚拟DOM的规模|
| 最复杂的指令   | ms-repeat|   ms-duplex |
| 组件指令     | ms-widget='id,name,opts'      | ms-widget='Array'传入一个对象数组，用法更灵活 |
| 组件生命周期   | onInit, onDispose    | onInit, onReady, onViewChange, onDispose|
| 动画	      |ms-effect	|ms-effect(与angular的animate更接近)|
| 如何操作组件  | 通过onInit取得组件vm进行操作   | 直接操作配置对象|
| 如何对组件传入大片内容  | 使用ms-html或改成模板   | 通过slot机制|
| 加载器        |  使用AMD风格的内置加载器            | 移除，建议使用webpack进行打包|
| 模块化        |  源码里自由划分           | 使用nodejs的require与module.exports组织起来|
| important指令 | 	有              |有（让页面渲染更快）|
|{{}}与ms-text的关系|ms-text会对内容再次扫描,不是单纯等价于{{}}|完全等价
| if指令        | ms-if           | ms-if |
| attr指令       | ms-attr-name=value               | ms-attr="object" object是一个对象，方便每次处理多个属性 |
| class指令    | ms-class='xxx: toggle'       | ms-class＝’Array|Object|String‘ 用法变了|
| visible指令       | ms-visible       | ms-visible |
| 过滤器    | 只能用于innerText中的{{}}及ms-text, ms-html  | 数量琳琅满目，所有指令都支持|
| 模板指令      |  ms-include          | 移除，由于后端无法实现等价功能 |
| 事件指令      |  普通的事件绑定         | 能支持事件代理的都用事件代理 |
| 数据验证      |  使用oniui的validation |使用内置的ms-validate,ms-duplex,ms-rules|
| 后端渲染      |  实现成本高昂          | 轻松支持 |
| 核心架构       |  观察者模式 ＋ 属性劫持          | 大模板函数＋虚拟DOM＋属性劫持|