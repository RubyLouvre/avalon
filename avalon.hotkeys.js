define(["avalon"], function(avalon) {
    //组合键绑定
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

    function sortKey(key) {
        return key.replace("++", "+add").split("+").sort().join("+")
    }
    var callbacks = []
    function check(event, hotkeys) {
        var special = specialKeys[ event.keyCode ],
                //将keyCode转换为各种值
                character = String.fromCharCode(event.which).toLowerCase(),
                modif = "", possible = {};

        // 处理各种组合情况 (alt|ctrl|shift+X)
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

            if (modif === "shift+") {
                possible[ shiftNums[ character ] ] = true;
            }
        }
        if (possible[ hotkeys ]) {
            return true
        }
    }
    avalon.bindingHandlers.hotkeys = function(data, vmodels) {
        data.specialBind = function(elem, fn) {
            var obj = {
                elem: elem,
                fn: fn,
                hotkeys: sortKey(data.param)
            }
            callbacks.push(obj)
            data.specialUnbind = function() {
                avalon.Array.remove(callbacks, obj)
                delete data.specialBind
                delete data.specialUnbind
            }
        }
        avalon.bindingHandlers.on(data, vmodels)
    }
    avalon.bindingExecutors.hotkeys = avalon. bindingExecutors.on
    var root = document.documentElement
    var hotkeysCallback = function(e) {
        var safelist = callbacks.concat()
        for (var i = 0, obj; obj = safelist[i++]; ) {
            if (root.contains(obj.elem)) {
                if (check.call(obj.elem, e, obj.hotkeys)) {
                    return obj.fn.call(obj.elem, e)
                }
            } else {
                avalon.Array.remove(callbacks, obj)
            }
        }
    }
    avalon.bind(document, "keydown", hotkeysCallback)
    return avalon
})


//用法  ms-hotkeys-ctrl+1="jumpHead" ms-hotkeys-ctrl+u="deleteLine"