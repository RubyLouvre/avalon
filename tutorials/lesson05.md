# 属性操作
# attributes manipulating
avalon2与avalon1的属性操作虽然都是使用ms-attr，但用法完全不一样。  
avalon2 and avalon1 use `ms-attr` to manipulate attributes,but way of useing is exactly the different.  
avalon1是这样操作属性的  
avalon1 manipulate attributes like this  
```
<div ms-attr-aaa='a' ms-attr-bbb='b' ms-attr-ccc='b'></div>
```
其语法为  
the grammer is   
```
ms-attr-valueName="vmProp"
```  
有多少个属性就写多个ms-attr-。其中不能省略。此外，还存在ms-title, ms-alt，ms-src, ms-href, ms-selected, ms-checked等等缩略写法。但估计很少人知道，到底哪些属性可以缩写，哪些不能。  
you have to write ms-attr-s as many as your wanting attributes.Besides,there are ms-title, ms-alt，ms-src, ms-href, ms-selected, ms-checked ETC abbreviated writing,but barely no people can know them all very well.  
avalon2从减轻用户的记忆出发，将你要操作的属性全部打包成一个对象，并规定，只能属性值才能使用@开头的vm属性。此外，avalon2不存在ms-title这样的缩略写法。  
avalon2 redesign this directive from the angle of easy membering using a single object to contain all of you attributes,and set a rule: only attribute values can reference @mark started VM properties。Besides,there are ms-title liked abbreviated writings no more.  
<div ms-attr="{aaa:@a, bbb:@b+11, ccc: @fn(@d,@e)}"></div>
或者
or  
```
<div ms-attr="@attrObj"></div>
```  
attrObj为vm的一个对象属性，但这个不太常用。或者  
attrObj is an object from VM properties.Or do it like this  
```
<div ms-attr="[{@aaa:@a}, {bbb: @b}, @toggle ? {add:"111"}: {}]"></div>
```  
ms-attr直接对应一个数组。这个灵感是来自ReactNative的style指令，它们可以通过数组，传入多个样式对象…………  
ms-attr useing a Array.This is come from ReactNative's style diretive,it can pass multiple parameters using an Array.  
不过无论你怎么搞，最后你传的东西能保持avalon内部能将它变回一个对象就行了。  
Anyway,just make sure avalon can transform your data to a object and it will work.  
有时你的对象很长，需要换行，avalon2也是支持的，即便你写得像以下这么恶心，avalon2还是能认出来。  
Sometimes you hava many attributes and you want to wrap it,avalon2 support wraps well even in such a gross example.  
```
<!DOCTYPE html>
<html>
    <head>
        <title>TODO supply a title</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <script src="./dist/avalon.js"></script>
        <script >
            var vm = avalon.define({
                $id: "test",
                title:111,
                src: "222",
                lang: 333
            })

        </script>
    </head>
    <body ms-controller="test" >
          <div  aaa='ddd' bbb=333 
                ms-attr='{title: @title,
                    ddd:@src, 
                    lang:@lang}' >{{
                   @src ? 333: 'empty'
              }}</div>
          <input ms-duplex="@src"/>
    </body>
</html>
```

但为了性能起见，ms-attr最好还是保持在一行吧。  
for the sake of performance,please keep ms-attr short in a single line
