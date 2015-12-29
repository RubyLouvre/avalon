//添加更新真实DOM的钩子,钩子为指令的update方法,它们与绑定对象一样存在优化级
function addData(elem, name) {
    return elem[name] || (elem[name] = {})
}

function addHook(node, hook) {
    var hooks = node.change || (node.change = [])
    if (avalon.Array.ensure(hooks, hook)) {
        hooks.sort(bindingSorter)
    }
}

function addHooks(dir, binding) {
    var hook = dir.update
    hook.priority = binding.priority
    addHook(binding.element, hook)
}

function addAttrHook(node) {
    addHook(node, attrUpdate)
}
/*
 每次domReady时都会扫描全部DOM树
 创建一个虚拟DOM树
 如果之前存在一个虚拟DOM树,
 那么它的所有节点将打上disposed标记, 在gc系统中集中销毁
 
 然后扫描虚拟DOM树,将一些特有的绑定属性转换为虚拟组件(VComponent)
 如ms-repeat, ms-html, ms-if, ms-text, ms-include 
 现在虚拟DOM树存在4种类型 VElement, VComment, VText, VComponent
 其他绑定属性将转换绑定对象
 同一个元素底下的绑定对象按优化级排序, 依次初始化, 将它们关联到VM的对应属性的订阅者数组中
 
 绑定对象初始化会添加getter,change, update方法(ms-duplex还有setter方法)
 
 当VM属性变化时, 执行对应订阅数组的所有绑定对象的change方法,更新虚拟DOM树的某些属性或结构
 并且框架在执行这订阅数组前,将canUpdateEntity置为false, 用于批量更新真实DOM树,
 只有当更新完才将canUpdateEntity置为true
 
 批量更新真实DOM树的步骤如下:
 从上到下, 一个个真实DOM节点与虚拟DOM节点进行比较
 在上面的change方法会为虚拟DOM节点添加了一个change的钩子函数数组,
 里面拥有各种更新DOM的策略,这些钩子的优先级也排好了
 如果这个虚拟DOM没有change数组会直接跳过
 如果这个虚拟DOM打上skip或skipContent,也会跳过
 否则先判定其类型是否 VElement或VComponent,继续更新其孩子
 
 当此子树更新完了,就会更新它的下一个兄弟,是一个深序优先遍历算法
 
 此更新策略有如下特点
 从上到下更新, 如果上级节点要被删掉,即真实DOM没有对应的虚拟DOM, 那么
 下方的change数组会直接跳过
 
 用户对同一个属性进行操作, 会在change方法中被合并
 
 订阅数组中的绑定对象的移除,之前是通过判定element是否在DOM树上,不断调用contains方法
 性能很差, 现在这个element为虚拟DOM, 它是否移除看disposed属性
 
 ms-repeat等重型指令,其处理对象也是一堆repeatItem 组件, 排序添加删除只是一个普通的JS操作,
 比真实DOM的移动轻量多了
 
 
 */