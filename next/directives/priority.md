#指令优先级

important  1
controller 2
for        3
widget     4
effect     5
if         6

元素节点变成虚拟DOM

遍历虚拟DOM,调整结构,在遍历过程中,得到vm

解析所有指令 ,vm.$watch(path, cb), ms-for里面的全部合成一个

遍历所有虚拟DOM, 转换为方法


