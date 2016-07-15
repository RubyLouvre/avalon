/* 
 * 对html实体进行转义
 * https://github.com/substack/node-ent
 * http://www.cnblogs.com/xdp-gacl/p/3722642.html
 * http://www.stefankrause.net/js-frameworks-benchmark2/webdriver-java/table.html
 */

var rentities = /&[a-z0-9#]{2,10};/
var temp = avalon.avalonDiv
module.exports = function (str) {
    if (rentities.test(str)) {
        temp.innerHTML = str
        return temp.innerText || temp.textContent
    }
    return str
}