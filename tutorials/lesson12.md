#数据验证
#Data Validation
avalon2砍掉了不少功能（如ms-include,ms-data），腾出空间加了其他更有用的功能。数据验证就是其中之一。

Many features have been stripped from avalon 2, such as ms-include and ms-data,to provide enough room for the other useful features.Data validation is one of those important features.


现在avalon2内置的验证指令是参考之前的oniui验证框架与jquery validation。

Nowadays, the validation directives ,which is built in avalon 2,is inspired by the oniui validation framework and jquery validation.

内置验证规则有

The rules of validation,which is built in avalon.js, can be listed as follows. 

这些验证规则要求使用ms-rules指令表示，要求为一个普通的JS对象。

These rules of validation should be presented by ms-rules,they must be ordinary objects in javascript.

此外要求验征框架能动起来，还必须在所有表单元素外包一个form元素，在form元素上加ms-validate指令。

In addition, the validation framework is supposed to be movable,and it should wrap a <form> around all the form elements,and it should add the directive ms-validate in the form element.

因此，要运行起avalon2的内置验证框架，必须同时使用三个指令。ms-validate用于定义各种回调与全局的配置项（如什么时候进行验证）。ms-duplex用于将单个表单元素及相关信息组成一个Field对象，放到ms-validater指令的fields数组中。ms-rules用于定义验证规则。如果验证规则不满足你，你可以自行在avalon.validators对象上添加。

Therefore,in order to run avalon2's built-in validation framework successfully,three directives should be taken in the same time.ms-validate is used to define different kinds of callbacks and the global configuration,such as when the validation happened.ms-duplex is used to make up a Field object by single form element and relevant information,the Field element will be put in the fields array maintained by ms-validater.ms-rules is used to define the rules of validation,If you are not satisfied with the rules that exists,you can define your own rules on the avalon.validators object.

现在我们可以一下ms-validate的用法。其对应一个对象。

Now we can learn a little about the usage of ms-validate,which is in accordance with an object.

在上表还有一个没有提到的东西是如何显示错误信息，这个avalon不帮你处理。但提示信息会帮你拼好，如果你没有写，直接用验证规则的message，否则在元素上找data-message或data-required-message这样的属性。

In the former table,the topic about how the error information will be presented haven't been mentioned.In fact,this will not be handled by avalon,but avalon will help you with the hint information.If you don't write error information,you can directly make use of the message defined in the rules of validation,otherwise,avalon will scan the element to look for properties like data-message and data-required-message.

最后给一个复杂的例子：

Here comes a complicated example:
