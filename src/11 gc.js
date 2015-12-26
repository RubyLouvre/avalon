/*********************************************************************
 *                          定时GC回收机制                             *
 **********************************************************************/

var disposeQueue = avalon.$$subscribers = []
var beginTime = new Date()
var oldInfo = {}


//添加到回收列队中
function injectDisposeQueue(data, list) {
    var lists = data.lists || (data.lists = [])
    var uuid = getUid(data)
    avalon.Array.ensure(lists, list)
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
    allTypes.forEach(function (type) {
        if (oldInfo[type] !== newInfo[type]) {
            iffishTypes[type] = 1
            diff = true
        }
    })
    i = n
    if (diff) {
        while (data = disposeQueue[--i]) {
            if (data.element === null) {
                disposeQueue.splice(i, 1)
                continue
            }
            if (iffishTypes[data.type] && shouldDispose(data.element)) { //如果它没有在DOM树
                disposeQueue.splice(i, 1)
                delete disposeQueue[data.uuid]
                var lists = data.lists
                if (lists) {
                    for (var k = 0, list; list = lists[k++]; ) {
                        avalon.Array.remove(lists, list)
                        avalon.Array.remove(list, data)
                    }
                }
                disposeData(data)
            }
        }
    }
    oldInfo = newInfo
    beginTime = new Date()
}

function disposeData(data) {
    delete disposeQueue[data.uuid] // 先清除，不然无法回收了
    data.element = null
    data.dispose && data.dispose()
    for (var key in data) {
        data[key] = null
    }
}

function shouldDispose(el) {
    return !el || el.disposed
}
