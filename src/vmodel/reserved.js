/**
$$skipArray:是系统级通用的不可监听属性
$skipArray: 是当前对象特有的不可监听属性

 不同点是
 $$skipArray被hasOwnProperty后返回false
 $skipArray被hasOwnProperty后返回true
 */
var falsy
export var $$skipArray = {
    $id: falsy,
    $render: falsy,
    $track: falsy,
    $element: falsy,
    $watch: falsy,
    $fire: falsy,
    $events: falsy,
    $accessors: falsy,
    $hashcode: falsy,
    $mutations: falsy,
    $vbthis:falsy,
    $vbsetter: falsy
}