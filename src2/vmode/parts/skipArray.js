/**
 * 
$$skipArray:是系统级通用的不可监听属性
$skipArray: 是当前对象特有的不可监听属性
 不同点是
 $$skipArray被hasOwnProperty后返回false
 $skipArray被hasOwnProperty后返回true
 */

module.exports = avalon.oneObject('$id,$watchers,$track,$element,$watch,$fire,$events,$model,$skipArray,$accessors,$hashcode,__proxy__,__data__,__const__')