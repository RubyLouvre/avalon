define(["avalon"], function(avalon) {
    var specialKeys = {
        8: "backspace", 9: "tab", 10: "return", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
        20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
        37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
        96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
        104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111: "/",
        112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
        120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 186: ";", 191: "/",
        220: "\\", 222: "'", 224: "meta"
    }
    var shiftNums = {
        "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
        "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
        ".": ">", "/": "?", "\\": "|"
    }
    var textAcceptingInputTypes = avalon.oneObject("text,password,number,email,url,range,date,month,week,time,datetime,search,color,tel")
    var reg = /textarea|select/i
    function sortKey(key) {
        return key.replace("++", "+add").split("+").sort().join("+")
    }
    function check(event, hotkeys) {
        if (this !== event.target && (reg.test(event.target.nodeName) ||
                textAcceptingInputTypes[event.target.type] == void 0)) {
            return;
        }

        var special = specialKeys[ event.keyCode ],
                // character codes are available only in keypress
                character = String.fromCharCode(event.which).toLowerCase(),
                modif = "", possible = {};
        // check combinations (alt|ctrl|shift+anything)
        if (event.altKey && special !== "alt") {
            modif += "alt+";
        }

        if (event.ctrlKey && special !== "ctrl") {
            modif += "ctrl+";
        }

        if (event.metaKey && !event.ctrlKey && special !== "meta") {
            modif += "meta+";
        }

        if (event.shiftKey && special !== "shift") {
            modif += "shift+";
        }

        if (character) {
            possible[ sortKey(modif + character) ] = true;
            possible[ sortKey(modif + shiftNums[ character ]) ] = true;
            // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
            if (modif === "shift+") {
                possible[ shiftNums[ character ] ] = true;
            }

        }
        console.log(possible)
        if (possible[ hotkeys ] && event.type == "keyup") {
            return true
        }
    }
    avalon.bindingHandlers.hotkeys = function(data, vmodels) {
        var hotkeys = sortKey(data.param)
        data.specialBind = function(elem, fn) {
            callback = function(e) {
                if (check.call(this, e, hotkeys)) {
                    return fn.call(this, e)
                }
                return false
            }
            var keydownFn = avalon.bind(elem, "keydown", callback)
            var keyupFn = avalon.bind(elem, "keyup", callback)
            data.specialUnbind = function() {
                avalon.unbind(elem, "keydown", keydownFn)
                avalon.unbind(elem, "keyup", keyupFn)
                delete data.specialBind
                delete data.specialUnbind
            }
        }
        avalon.bindingHandlers.on(data, vmodels)
    }
    return avalon
})


//用法  ms-hotkeys-ctrl+1="callback"