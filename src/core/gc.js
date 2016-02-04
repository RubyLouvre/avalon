/*********************************************************************
 *                          定时GC回收机制                             *
 **********************************************************************/
var getUid = require("../base/builtin").getUid

var disposeQueue = avalon.$$subscribers = []

//添加到回收列队中
function injectDisposeQueue(data, list) {
    var uuid = getUid(data)
    data.list = list

    if (!disposeQueue[uuid]) {
        disposeQueue[uuid] = "__"
        data.i = ~~data.i
        disposeQueue.push(data)
    }
}


var lastGCIndex = 0
function rejectDisposeQueue(data) {
    var i = lastGCIndex || disposeQueue.length
    var threshold = 0
    while (data = disposeQueue[--i]) {
        if (data.i < 7) {
            if (data.element === null) {
                disposeQueue.splice(i, 1)
                if (data.list) {
                    avalon.Array.remove(data.list, data)
                    delete disposeQueue[data.uuid]
                }
                continue
            }
            if (data.shouldDispose()) { //如果它的虚拟DOM不在VTree上或其属性不在VM上
                disposeQueue.splice(i, 1)
                avalon.Array.remove(data.list, data)
                disposeData(data)
                //avalon会在每次全量更新时,比较上次执行时间,
                //假若距离上次有半秒,就会发起一次GC,并且只检测当中的500个绑定
                //而一个正常的页面不会超过2000个绑定(500即取其4分之一)
                //用户频繁操作页面,那么2,3秒内就把所有绑定检测一遍,将无效的绑定移除
                if (threshold++ > 500) {
                    lastGCIndex = i
                    break
                }
                continue
            }
            data.i++
            //基于检测频率，如果检测过7次，可以认为其是长久存在的节点，那么以后每7次才检测一次
            if (data.i === 7) {
                data.i = 14
            }
        } else {
            data.i--
        }
    }
    rejectDisposeQueue.beginTime = new Date()
}

rejectDisposeQueue.beginTime = new Date()

function disposeData(data) {
    if (!data.uuid)
        return
    delete disposeQueue[data.uuid]
    var el = data.element
    if (el) {
        el.dispose && el.dispose()
        data.element = null
    }
    for (var key in data) {
        data[key] = null
    }
}

module.exports = {
    injectDisposeQueue: injectDisposeQueue,
    rejectDisposeQueue: rejectDisposeQueue
}