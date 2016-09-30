import avalon from './core'
import {Cache} from './cache'


/* 
 * 对html实体进行转义
 * https://github.com/substack/node-ent
 * http://www.cnblogs.com/xdp-gacl/p/3722642.html
 * http://www.stefankrause.net/js-frameworks-benchmark2/webdriver-java/table.html
 */

var rentities = /&[a-z0-9#]{2,10};/
var temp = avalon.avalonDiv
avalon.shadowCopy(avalon, {
    evaluatorPool: new Cache(888),
    _decode: function (str) {
        if (rentities.test(str)) {
            temp.innerHTML = str
            return temp.innerText || temp.textContent
        }
        return str
    }
})

export var directives = avalon.directives

//export default avalon
//生成事件回调的UUID(用户通过ms-on指令)
export function getLongID(fn) {
    /* istanbul ignore next */
    return fn.uuid || (fn.uuid = avalon.makeHashCode('e'))
}
var UUID = 1
//生成事件回调的UUID(用户通过avalon.bind)
export function getShortID(fn) {
    /* istanbul ignore next */
    return fn.uuid || (fn.uuid = '_' + (++UUID))
}
export var quote = avalon.quote
export var win = avalon.window
export var doc = avalon.document
export var root = avalon.root
export var modern = avalon.modern
export var eventHooks = avalon.eventHooks

