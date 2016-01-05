/*********************************************************************
 *                          定时GC回收机制                             *
 **********************************************************************/

var disposeQueue = avalon.$$subscribers = []
var beginTime = new Date()
var oldInfo = {}


//添加到回收列队中
function injectDisposeQueue(data, list) {
    var uuid = getUid(data)
    data.list = list
    if (!disposeQueue[uuid]) {
        disposeQueue[uuid] = "__"
        disposeQueue.push(data)
    }
}

function rejectDisposeQueue(data) {
    var i = disposeQueue.length
    var n = i
    var allTypes = []
    var iffishTypes = {}
    var newInfo = {}
    //对页面上所有绑定对象进行分门别类, 只检测个数发生变化的类型
    while (data = disposeQueue[--i]) {
        var type = data.type
        if (newInfo[type]) {
            newInfo[type]++
        } else {
            newInfo[type] = 1
            allTypes.push(type)
        }
    }
    var diff = false
    for (var j = 0, jn = allTypes.length; j < jn; j++) {
        type = allTypes[j]
        if (oldInfo[type] !== newInfo[type]) {
            iffishTypes[type] = 1
            diff = true
        }
    }
    i = n
    var threshold = 0
    if (diff) {
        while (data = disposeQueue[--i]) {
            if (data.element === null) {
                disposeQueue.splice(i, 1)
                if (data.list) {
                    avalon.Array.remove(data.list, data)
                    delete disposeQueue[data.uuid]
                }
                continue
            }
            if (iffishTypes[data.type] && data.shouldDispose()) { //如果它没有在DOM树
                disposeQueue.splice(i, 1)
                avalon.Array.remove(data.list, data)
                disposeData(data)
                if (threshold++ > 256) {
                    break
                }
            }
        }

    }
    console.log("disposeQueue.length ",disposeQueue.length)
    oldInfo = newInfo
    beginTime = new Date()
}

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

