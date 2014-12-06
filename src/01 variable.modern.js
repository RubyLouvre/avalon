/*********************************************************************
 *                    全局变量及方法                                  *
 **********************************************************************/
var expose = Date.now()
var head = DOC.head //HEAD元素

head.insertAdjacentHTML("afterBegin", '<avalon><style id="avalonStyle">.avalonHide{ display: none!important }</style></avalon>')
var ifGroup = head.firstChild

function log() {
    if (avalon.config.debug) {
// http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
        console.log.apply(console, arguments)
    }
}