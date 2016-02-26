指令的设计
==========

分成4种指令

##注释节点的指令

它们用于放置逻辑， 它们不是表示一个组件的状态，是嵌入必须的业务代码，生成中间变量

```html
<!--for: item in @array-->
<!--for: （key,value）in @array-->
<!--forEnd:-->


<!--js: var fullName = @firstName + @lastName-->

```
### for:与forEnd:
可使用过滤器 它们是一起使用，循环生成它们之间的内容，并在后面生成一个注释节点做锚记（用于以后高效地移动）

```html
<!--for: item in @array-->
<!--js:if(item > 5){ return }-->
<p>{{item}}</p>
<!--forEnd:-->
```

上面代码可以忽略生成数组中元素大于4的部分

### if:
可使用过滤器，根据其值将离其最近的`元素节点`移出或插入，多用于tooltip之类的浮动型组件的显示或隐藏

### js:
不能使用过滤，直接砍掉js:后，拼接入模板函数内部
用于添加必要的业务逻辑


## 元素节点上的绑定属性

### av-skip
只要存在此属性，不管其值为何，都立即对此元素及其子孙停止扫描

### av-cloak
用于掩盖首屏上的`{{ }}`，当avalon引擎扫描到此元素时，会移除av-cloak属性及同名类名

```css
[av-cloak],  .ng-cloak {
  display: none !important;
}
```
### av-if


### av-attr
```
 av-attr="{ title:@title, align:@bb+1 }"
 av-attr="[ @obj1, @obj2 ]"
 av-attr="@obj"
 av-attr="[ @obj1, isB ? @objB : {}]"
```
指定一个属性，可使用过滤器， 但其值为false，null, undefined，会移除真实DOM的对应属性

#### av-visible="@toggle"
可使用过滤器， 对元素的style.display进行处理

### av-class
```
 av-class="{ 'class-a': @isA, 'class-b': @isB }"
 av-class="[ @a, @b ]"
 av-class="[classA, isB ? classB : '']"
```
可使用过滤器，为元素添加一组类名，当类名发生变动时，以前添加的类名会被移除。 有对象及数组两种形式。数组应该为一个字符串数组，且元素不能为空字符串。

### av-hover
类似于*av-class*，但在用户滑过此元素表面时会添加这些类名，离开时移除类名

### av-active

类似于av-class，但在用户点击此元素时添加这些类名，鼠标弹出时离开时移除类名

### av-style
```
av-style="@styleObject"
av-style="[@styleObject,@styleObject2]"
```
可使用过滤器，功能类似于之前的ms-css，用于设置元素的样式

### av-on
```
av-on-click="@fn"
av-on-keydown="@xxx |enter"
av-click="@fn"
```
可使用特定的过滤器(stop, prevent, up,down,right, left, esc,tab, enter,space,del),绑事事件回调

### av-text

可使用过滤器 类似于`{{ }}`，会清空此元素底下的所有节点，再添加新文本内容

### av-html
```/Users/qitmac000408/avalon/avaloon2 vm的设计.md
av-html="@longtext"
```
可使用过滤器，将vm中的某个字任串属性转换成HTML节点，插入到目标元素底下，

### av-duplex
可使用过滤器，双工绑定


### av-effect
可使用过滤器，结合其他指令使用动画效果

### av-widget
```
av-wiget="@obj"
av-wiget="{title: @ddd, $id: "sss"}"
av-wiget="[@obj1,@obj2,{$id: 'item' + i }]"
```
可使用过滤器，将普通元素变成一个组件

```
av-attr="{xxx:yyy}"--> props[av-attr] = fn
av-text   --> 检测template children 与 update
av-html   --> 检测template children 与 update
av-duplex --> 检测DOM的update
av-on     --> 检测DOM的update
```


| 指令           | 语法               | 进度  |
| ------------- |:-----------------:| -----:|
| av-attr       | 对象或对象数组       | yes |
| av-style      | 对象或对象数组       | yes |
| expr          | 字符                | yes |
| av-class      | 布尔对象或字符串数组  | half |
| av-hover      | 布尔对象或字符串数组  | half |
| av-active     | 布尔对象或字符串数组  | half |
| av-on         | 函数                | no |
| av-text       | 字符串              | yes |
| av-html       | 字符串              | yes |
| av-effect     | 对象或对象数组        | no |
| av-widget     | 对象或对象数组        | no |
| if指令        |     合法JS代码       | half |
| for指令       | 类PHP的特殊语法       | half |
| forEnd指令    | 空指令（仅表示结束）   | yes|
| js指令        |  合法JS代码          | yes|