import './seed/core.spec'
import './seed/browser.spec'
import './seed/cache.spec'
import './seed/lang.compact.spec'

import './filters/index.spec'


import './vdom/compact.spec'

//DOM相关测试

import './dom/shim.compact.spec'
import './dom/ready.compact.spec'
import './dom/val.compact.spec'
import './dom/class.compact.spec'
import './dom/html.spec'
import './dom/attr.compact.spec'
import './dom/event.compact.spec'
import './dom/css.compact.spec'


import './vtree/clearString.spec'
import './vtree/fromString.spec'
import './vtree/fromDOM.spec'


import './vmodel/compact.spec'

import './parser/index'

//这不是测试，但下面的模块都依赖这个

import '../src/directives/compact'
import '../src/renders/domRender'

import './directives/attr.spec'
import './directives/duplex.spec'

import './directives/expr.spec'
import './directives/css.spec'
import './directives/important.spec'
import './directives/on.spec'

import './directives/controller.spec'
import './directives/if.spec'

import './directives/text.spec'
import './directives/class.spec'
import './directives/hover.spec'
import './directives/active.spec'
import './directives/visible.spec'
import './directives/validate.spec'
import './directives/rules.spec'

import './directives/for.spec'
import './directives/effect.spec'

import './directives/widget.spec'

