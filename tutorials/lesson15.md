##avalon的指令在上一节已经全部介绍完毕，当然有的语焉不详，如ms-js。本节主要讲述一下我对这方面的思考与探索。
##avalon  directives have been all introduced to you in last section,of course there were some vagues like ms-js.I will talk about my thinkings and exploring of directives in this section.
##MVVM的成功很大一语分是来自于其指令，或叫绑定。让操作视图的功能交由形形式式的指令来代劳。VM，成了一个大管家。它只一个反射体。我们对它的操作，直接影响到视图。因此俗称“操作数据即操作视图”！至于它是怎么影响视图，avalon视其版本的不同，也有不同的解法。如果抛开avalon，纵观世上所有MVVM框架，大抵有如下几种方式
##a lot of parts of MVVM success come from diretives,or binding,Diretives operates DOM for you.VM, has become a butler.It‘s a reflector，operations to VM will reflect to View.This is why we all call it“operating variables is operating View“！As to exactly how does VM changes View，different avalon has different method。Regardless of avalon，all MVVM frameworks use the following methods.
1.函数wrapper:将原数据对象重新改造，所有属性都变成一个函数，有参数时就是赋值，进行视图同步与回调派发，没有参数时就取值，进行依赖收集。如knockout.js。  
1.function wrapper:transform the original data object,make every property a function,while with a parameter it‘s a value assigning,the function Synchronize View and distribute callbacks,while no parameter,it gets it's value and collects relys。For example：knockout.js.

2.上帝getter,setter: 将原数据对象重新包装，但对数据的操作必须经过统一的set,get方法。在set方法进行视图同步与回调派发，没有参数时进行依赖收集。如reactive.js。如果放松要求，react.js也是这种方式，它使用setState进行视图同步。但它们依赖收集的过程。  
2.God getter and setter:repack original data object,makes operating values must use unified set,get functions.Use set to Synchronize View and distribute callbacks,get it's value and collects relys while no parameters.For example:reactive.js.If imprecisely,react use this method as well,react.js use setState to Synchronize View，but setState rely on process of collecting.

3.函数编译及脏检测：将VM放到一个函数体内，取toString重新编译，内部是第一种方式。如angular.js.  
3.Function compilation and dirty-checking:put VM inside a function,get it's toString for recompiling,and use method1 inside.f】For example:angular.js.

