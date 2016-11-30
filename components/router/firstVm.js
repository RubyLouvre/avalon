var avalon = require('../../dist/avalon')
avalon.parsers.card = function(a) {
    return a.replace(/\s/g, '').replace(/(\d{4})/g, "$1 ").trim()
}
var vm = avalon.define({
    $id: "first",
    tabs: [111, 222, 333],
    activeIndex: 0,
    aaa: '',
    panels: ["面板1", "面板2", '<p>这里可以是复杂的<b>HTML</b></p>'],
    formatCard: function(e) {
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
//成绩单
//大家可以对比一下1.*的相同实现
//http://www.cnblogs.com/rubylouvre/p/3213430.html
var model = avalon.define({
    $id: 'transcript',
    id:  '',
    name: '',
    score: 0,
    total: 0,
    array: [],
    add: function() {
        this.array.push({
            id: this.id,
            name: this.name,
            score: this.score
        })
    }
})

model.$watch("score", function(a) {
    var a = Number(a) || 0
    a = a > 100 ? 100 : a < 0 ? 0 : a //强制转换为0~100间
    model.score = a
})
model.$watch("array", function() {
    var a = 0
    model.array.forEach(function(el) {
        a += el.score //求得总数
    })
    model.total = a;
    model.id = ""
    model.name = ""
    model.score = 0
})
model.array = [
    { id: "d1", name: "李世民", score: 67 },
    { id: "d2", name: "赢政", score: 90 }
]
module.exports = vm