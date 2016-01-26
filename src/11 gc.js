/*********************************************************************
 *                     定时GC回收机制 (基于1.6基于频率的GC)                *
 **********************************************************************/

var disposeQueue = avalon.$$subscribers = []
var beginTime = new Date()

//添加到回收列队中
function injectDisposeQueue(data, list) {
    data.list = list
    data.i = ~~data.i
    if (!data.uuid) {
        data.uuid = "_" + (++bindingID)
    }
    if (!disposeQueue[data.uuid]) {
        disposeQueue[data.uuid] = "__"
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
            if (shouldDispose(data.element)) { //如果它的虚拟DOM不在VTree上或其属性不在VM上
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
    beginTime = new Date()
}

function disposeData(data) {
    delete disposeQueue[data.uuid] // 先清除，不然无法回收了
    data.element = null
    data.rollback && data.rollback()
    for (var key in data) {
        data[key] = null
    }
}

function shouldDispose(el) {
    try {//IE下，如果文本节点脱离DOM树，访问parentNode会报错
        var fireError = el.parentNode.nodeType
    } catch (e) {
        return true
    }
    if (el.ifRemove) {
        // 如果节点被放到ifGroup，才移除
        if (!root.contains(el.ifRemove) && (ifGroup === el.parentNode)) {
            el.parentNode && el.parentNode.removeChild(el)
            return true
        }
    }
    return el.msRetain ? 0 : (el.nodeType === 1 ? !root.contains(el) : !avalon.contains(root, el))
}
