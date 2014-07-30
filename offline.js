if (typeof QApp === "undefined") {
    window.QApp = {}
}

(function() {
    var QApp = window.QApp
    window.addEventListener('load', function() {
        function updateOnlineStatus(event) {
            var condition = navigator.onLine ? "online" : "offline";
            if(typeof QApp.trigger !== "function"){
                 QApp.trigger = function(){}
            }
            if (condition === "online") {
                QApp.trigger("online")
            } else {
                QApp.trigger("offline")
            }
        }
    })
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
})()
// by司徒正美 2014,7,30
// QApp.on("online", fn)
// QApp.on("offline", fn)
//自定义事件系统 on off trigger once
//http://wiki.corp.qunar.com/display/HOTELUED/2014-07-28

// https://github.com/ecomfe/saber
//http://gmu.baidu.com/?qq-pf-to=pcqq.group
//https://github.com/kissyteam/kissy/blob/master/src/feature/src/feature.js