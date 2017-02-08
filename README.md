#avalon 2 

<p align="center">
<a href="https://badge.fury.io/js/avalon2">
<img src="https://badge.fury.io/js/avalon2.svg" alt="npm version" height="18">
</a>
<a href="https://travis-ci.org/RubyLouvre/avalon">
<img src="https://travis-ci.org/RubyLouvre/avalon.svg?branch=master" alt="Travis CI Status"/>
</a>
<a href="https://codeclimate.com/github/RubyLouvre/avalon"><img src="https://codeclimate.com/github/RubyLouvre/avalon/badges/gpa.svg" /></a>

<a href="https://codecov.io/gh/RubyLouvre/avalon">
  <img src="https://codecov.io/gh/RubyLouvre/avalon/branch/master/graph/badge.svg" alt="Codecov" />
</a>

<a href="https://github.com/RubyLouvre/avalon">
<img src="https://camo.githubusercontent.com/fc56303af12c023343f338a762b6bfb2a5f1e4dc/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f6c6963656e73652d4d49542d677265656e2e7376673f7374796c653d666c6174" alt="LICENSE" data-canonical-src="https://img.shields.io/badge/license-MIT-green.svg?style=flat" style="max-width:100%;"></a>
<a href="https://saucelabs.com/beta/builds/7c80ed0dd7b34c55815d65a132ff0226"><img src="https://saucelabs.com/buildstatus/rubylouvre" alt="Build Status"></a>
</p>
<p align="center">
<a href="https://saucelabs.com/beta/builds/7c80ed0dd7b34c55815d65a132ff0226"><img src="https://saucelabs.com/browser-matrix/rubylouvre.svg" alt="Browser Matrix"></a>
</p>


```javascript
npm install avalon2
```

es6调用方式 
```
import * as avalon from 'avalon2'
```

###[English tutorials](https://github.com/RubyLouvre/avalon/tree/master/tutorials)

###[avalon cookbook](https://github.com/RubyLouvre/avalon/blob/2.1.8/avalon%20cookbook.pdf)

这是基于官网制成的电子书,方便大家离线阅览

###[avalon2官网](http://avalonjs.coding.me/)
这是基于gitbook制作的,对移动端支持很好,大家上班或睡觉时,可以过目一下.

###[avalon2+webpack2手脚架](https://github.com/sayll/avalon-webpack-start)

###[QuickStart](https://github.com/RubyLouvre/avalon/tree/master/components/router)
大家期望已久的avalon2+mmRouter+各种组件的综合示例,不断完善中







###谁在用avalon

<img src='http://avalonjs.coding.me/styles/logos.jpg' width='639' height='477' />

`欢迎大家提交logo与官网链接`


###超高性能

<img src="http://avalonjs.coding.me/styles/performance.jpg" width='770' height='451' />


测试页面 perf目录下的index.html, index1.4.html, index-ng.html, index-vue.html,index-react.html

亮点,如果页面上存在一个大表格或列表,其他框架会在浏览器加载页面时会卡一下(白屏), 
而avalon则平缓多了

thanks http://charts.udpwork.com/

###支持后端渲染

avalon2.1.5起支持后端渲染,详见[这里](https://github.com/RubyLouvre/avalon-server-render-example)


### [avalon2 学习教程(包括组件)](https://segmentfault.com/u/situzhengmei/articles)


HTML指南

属性值必须用双引号括起,标签名必须小写, 标签必须被关闭（正常关闭，或自关闭）

组件, 在兼容IE6-8的情况下,组件必须用wbr, xmp做容器

组件名如果不充当标签名,可以不以ms-开头.

绑定属性建议使用短指令方式定义,即ms-if可以改成:if

ms-duplex指令除了change, rebounce过滤器外,不建议使用其他过滤器做格式化,
建议添加ms-input, ms-change在里面处理

ms-duplex不支持对简单数组的元素的处理, 即`vm.arr = [1,2,4]`,
`<input :for="el in @arr" duplex="el"`


ms-important与ms-controller对应的vm.$id一个页面上只能用一次,不能存在多个同名的ms-controller.
     ms-important由于不继承上级的$element与$render,每次只更新它所在的区域,善用它能大大提高性能
```html
   <div ms-controller='test'>{{@aaa}}</div>
   <div ms-controller='test'>{{@bbb}}<!--test已经使用了1次!会导致程序出错--></div>
   <div ms-important='test'>{{@bbb}}<!--test已经使用了2次!会导致程序出错--></div>
```
