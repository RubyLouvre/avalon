var avalon = require('../../dist/avalon')
avalon.parsers.card = function(a){
    return a.replace(/\s/g, '').replace(/(\d{4})/g, "$1 ").trim()
}
var vm = avalon.define({
    $id:"first",
    tabs: [111,222,333],
    activeIndex: 0,
    aaa: '',
    panels: ["面板1","面板2",'<p>这里可以是复杂的<b>HTML</b></p>'],
    formatCard: function(e){
        var el = e.target 
        var caret = el.selectionStart
        var value = el.value
        var prev = value.slice(0, caret)
        var sp = (prev.match(/\s/) || []).length
        var curr = value.replace(/\s/g, '').replace(/(\d{4})/g, "$1 ").trim()
        var now = curr.slice(0, caret)
        var curSp = (now.match(/\s/) || []).length
        el.value = curr
        //同步到ms-duplex中的pos去
        el._ms_duplex_.pos = caret + curSp - sp
    }
   
})

module.exports = vm