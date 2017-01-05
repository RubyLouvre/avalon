请使用**webpack**打包,它们不包含在核心库里


这些手势是依赖于reconginzer模块
用到什么就包含什么,比如你想用tap模块，

在src建立一个avalon.tap.js

在export前引入这个模块
```javascript
import { avalon } from './seed/core'
import './seed/lang.compact'


import './filters/index'
import './dom/compact'

import './vtree/fromString'
import './vtree/fromDOM'

import './vdom/compact'
import './vmodel/compact'
import './directives/compact'

import './renders/domRender'

import './effect/index.js'
import './component/index'

import './gesture/tap'

export default avalon
```



然后模仿buildIE6,建议一个buildTap的打包文件

最后`node buildtap` 就行了

```


//你的业务代码

<div ms-on-drag="@drag">xxxx</div>

```