
import { avalon } from '../seed/core'
function toFixedFix(n, prec) {
        var k = Math.pow(10, prec)
        return '' + (Math.round(n * k) / k).toFixed(prec)
}
export function numberFilter(number, decimals, point, thousands) {
    //https://github.com/txgruppi/number_format
        //form http://phpjs.org/functions/number_format/
        //number 必需，要格式化的数字
        //decimals 可选，规定多少个小数位。
        //point 可选，规定用作小数点的字符串（默认为 . ）。
        //thousands 可选，规定用作千位分隔符的字符串（默认为 , ），如果设置了该参数，那么所有其他参数都是必需的。
        number = (number + '')
                .replace(/[^0-9+\-Ee.]/g, '')
        var n = !isFinite(+number) ? 0 : +number,
                prec = !isFinite(+decimals) ? 3 : Math.abs(decimals),
                sep = thousands || ",",
                dec = point || ".",
                s = ''

        // Fix for IE parseFloat(0.55).toFixed(0) = 0;
        s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
                .split('.')
        if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
        }
      /** //好像没有用
       var s1 = s[1] || ''
      
        if (s1.length < prec) {
                s1 += new Array(prec - s[1].length + 1).join('0')
                s[1] = s1
        }
        **/
        return s.join(dec)
}
