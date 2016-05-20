请使用**webpack**打包,它们不包含在核心库里

用到什么就包含什么,其中Recognizer为其他手势所引用
```
var avalon = require('./avalon')
require('./drag') //添加拖拽操作 

//你的业务代码

<div ms-on-drag="@drag">xxxx</div>

```