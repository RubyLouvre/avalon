var ravalon = /(\w+)\[(avalonctrl)="(\S+)"\]/
var findNodes = function(str) {
    //pc safari v5.1: typeof DOC.querySelectorAll(str) === 'function'
    //https://gist.github.com/DavidBruant/1016007
    return DOC.querySelectorAll(str)
} 