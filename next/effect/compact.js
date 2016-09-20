import avalon from "../seed/compact"
import "../dom/css/compact"
import effectDetect from './share'
/**
 * ------------------------------------------------------------
 * 检测浏览器对CSS动画的支持与API名
 * ------------------------------------------------------------
 */

export var effectSupport = effectDetect(
    avalon.cssName('transition-duration'),
    avalon.cssName('animation-duration'),
    avalon.window
    )
