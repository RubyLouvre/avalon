require('./important')
require('./controller')
//处理属性样式
require('./attr')

require('./css')
require('./visible')
////处理内容
require('./expr')
require('./text')
require('./html')
////需要用到事件的
require('./class.hover.active')
require('./on')
require('./duplex/compact')
require('./validate')
require('./rules')
//
////处理逻辑
require('./if')
require('./for')
//
require('./widget')
require('./effect')
//优先级 ms-important, ms-controller, ms-for, ms-widget, ms-effect, ms-if
//.......
//ms-duplex
