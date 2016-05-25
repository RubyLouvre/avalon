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

### ms-skip
只要存在此属性，不管其值为何，都立即对此元素及其子孙停止扫描


### ms-if


### ms-attr
```
 ms-attr="{ title:@title, align:@bb+1 }"
 ms-attr="[ @obj1, @obj2 ]"
 ms-attr="@obj"
 ms-attr="[ @obj1, isB ? @objB : {}]"
```
指定一个属性，可使用过滤器， 但其值为false，null, undefined，会移除真实DOM的对应属性

#### ms-visible="@toggle"
可使用过滤器， 对元素的style.display进行处理

### ms-class
```
 ms-class="{ 'class-a': @isA, 'class-b': @isB }"
 ms-class="[ @aObject, @bObject ]"
 ms-class="[ @aString, @isB && @bString]"
 ms-class="@classString"
```
可使用过滤器，为元素添加一组类名，当类名发生变动时，以前添加的类名会被移除。 有对象及数组两种形式。数组应该为一个字符串数组，且元素不能为空字符串。

### ms-hover
类似于*ms-class*，但在用户滑过此元素表面时会添加这些类名，离开时移除类名

### ms-active

类似于ms-class，但在用户点击此元素时添加这些类名，鼠标弹出时离开时移除类名

### ms-css
```
ms-css="@styleObject"
ms-css="[@styleObject,@styleObject2]"
```
可使用过滤器，功能类似于之前的ms-css，用于设置元素的样式

### ms-on

```javascript
ms-click="@fn"
ms-on-click-0=" @toggle = !@toggle"
ms-on-keydown="@xxx |stop"
ms-click="@fn"
```

可使用特定的过滤器(stop, prevent, up,down,right, left, esc,tab, enter,space,del),
绑事事件回调


可使用过滤器，将vm中的某个字任串属性转换成HTML节点，插入到目标元素底下，

### ms-duplex
可使用过滤器，双工绑定

### ms-rules
与双工绑定一起,用于定义验证规则
### ms-validate
用于验证数据

### ms-effect
可使用过滤器，结合其他指令使用动画效果


### ms-validate
只用于form元素上
```javascript
ms-validate="@obj"
```


### ms-rules
```javascript
ms-rules="@obj"
```

### ms-widget
```javascript
ms-widget="@obj"
ms-widget="{title: @ddd, $id: "sss"}"
ms-widget="[@obj1, @obj2 ,{$id: 'item' + i }]"
```

ms-widget的值可以为页面上一个临时对象,也可以是一个数组,或者指向vm中的一个对象属性
在内部发现是一个数组,会进行合并,保证只有一个对象(下称配置对象)
此配置对象应有$id, type这两个固定配置项
$id为组件vm的$id, type为组件的类型 




```html
<div ms-widget="{$id: @id, is:'panel',other:@param1}"></div>
```

如果元素为自定义元素那么,就不需要写is

```
<ms-panel ms-widget="{$id: @id,other:@param1}"></ms-panel>
```

```
    ms-attr="{xxx:yyy}"--> props[ms-attr] = fn
    ms-text   --> 检测template children 与 update
    ms-html   --> 检测template children 与 update
    ms-duplex --> 检测DOM的update
    ms-on     --> 检测DOM的update
```


| 指令           | 语法               | 进度  |
| ------------- |:-----------------:| -----:|
| ms-attr       | 对象或对象数组        | yes |
| ms-css      | 对象或对象数组          | yes |
| ms-controller | 字符串               | yes |
| text          | 字符串              | yes |
| ms-class      | 布尔对象或字符串数组    | yes |
| ms-hover      | 布尔对象或字符串数组    | yes |
| ms-active     | 布尔对象或字符串数组    | yes |
| ms-on         | 函数                | yes |
| ms-effect     | 对象或对象数组        | yes |
| ms-widget     | 对象或对象数组        | yes |
| ms-validate    | 对象或对象数组        | yes |
| ms-rules    | 对象或对象数组           | yes |
| if指令        |     合法JS代码        | yes |
| for指令       | 类PHP的特殊语法        | yes |
| forEnd指令    | 空指令（仅表示结束）     | yes|

