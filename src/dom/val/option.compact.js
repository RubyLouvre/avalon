/**
 * IE6/7/8中，如果option没有value值，那么将返回空字符串。
 * IE9/Firefox/Safari/Chrome/Opera 中先取option的value值，如果没有value属性，则取option的innerText值。
 * IE11及W3C，如果没有指定value，那么node.value默认为node.text（存在trim作），但IE9-10则是取innerHTML(没trim操作)
 */

export function getOption(node) {
      if(node.hasAttribute && node.hasAttribute('value')){
          return node.getAttribute('value')
      }
      var attr = node.getAttributeNode('value')
      if(attr && attr.specified){
          return attr.value
      }
      return node.innerHTML.trim()
}