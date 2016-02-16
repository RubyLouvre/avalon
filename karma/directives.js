var assert = chai.assert;
var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, "><")
}
function fireClick(el) {
    if (el.click) {
        el.click()
    } else {
//https://developer.mozilla.org/samples/domref/dispatchEvent.html
        var evt = document.createEvent("MouseEvents")
        evt.initMouseEvent("click", true, true, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
        !el.dispatchEvent(evt);
    }
}
describe('{{}}', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement("div")
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it("text", function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller=expr1>{{aa_bb}}</div>
             */
        })

        vm = avalon.define({
            $id: "expr1",
            "aa_bb": "司徒正美"
        })
        avalon.scan(div, vm)
        expect(div.children[0].innerHTML).to.equal("司徒正美")
        vm.aa_bb = "新的内容"
        setTimeout(function () {
            expect(div.children[0].innerHTML).to.equal("新的内容")
            done()
        })

    })
    it("text+attr", function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller=expr2 ms-attr-title="{{a}} {{b}}">{{a}} {{b}}</div>
             */
        })

        vm = avalon.define({
            $id: "expr2",
            a: "司徒正美",
            b: "清风火羽"
        })

        avalon.scan(div, vm)
        expect(div.children[0].innerHTML).to.equal("司徒正美 清风火羽")
        expect(div.children[0].title).to.equal("司徒正美 清风火羽")
        vm.a = "王国之心"
        setTimeout(function () {
            expect(div.children[0].innerHTML).to.equal("王国之心 清风火羽")
            expect(div.children[0].title).to.equal("王国之心 清风火羽")
            done()
        })

    })
    it("value", function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <input ms-controller=expr3 ms-attr-value="a">
             */
        })

        vm = avalon.define({
            $id: "expr3",
            a: "司徒正美"
        })

        avalon.scan(div, vm)
        expect(div.children[0].value).to.equal("司徒正美")
        vm.a = "新的值"
        setTimeout(function () {
            expect(div.children[0].value).to.equal("新的值")
            done()
        })


    })


})
describe('css', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement("div")
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it("background", function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="css1" ms-css-background=a>测试样式</div>
             */
        })

        vm = avalon.define({
            $id: "css1",
            a: "red"
        })
        avalon.scan(div, vm)
        var css = div.children[0].style
        expect(css.backgroundColor).to.equal("red")

        vm.a = "#a9ea00"
        setTimeout(function () {
            expect(css.backgroundColor).to.match(/#a9ea00|rgb\(169, 234, 0\)/)
            vm.a = "#cdcdcd"
            setTimeout(function () {
                expect(css.backgroundColor).to.match(/#cdcdcd|rgb\(205, 205, 205\)/)
                done()
            }, 100)
        }, 100)

    })

    it("float", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="css2" ms-css-float=a>测试样式</div>
             */
        })

        vm = avalon.define({
            $id: "css2",
            a: "right"
        })

        avalon.scan(div, vm)
        var css = div.children[0].style
        expect(css["float"]).to.equal("right")

        vm.a = "left"
        vm.a = "right"
        vm.a = "left"
        setTimeout(function () {
            expect(css["float"]).to.equal("left")
            done()
        })

    })
    it("width", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="css3" ms-css-width=a>测试样式</div>
             */
        })

        vm = avalon.define({
            $id: "css3",
            a: 100
        })

        avalon.scan(div, vm)

        expect(avalon(div.children[0]).width()).to.equal(100)
        expect(div.children[0].style.width).to.equal("100px")
        vm.a = 150
        setTimeout(function () {
            expect(avalon(div.children[0]).width()).to.equal(150)
            expect(div.children[0].style.width).to.equal("150px")

            done()
        })
    })

    it("opacity", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="css4" ms-css-opacity=a>测试样式</div>
             */
        })
        vm = avalon.define({
            $id: "css4",
            a: 0.6
        })
        avalon.scan(div, vm)
        var el = avalon(div.children[0])
        expect(Number(el.css("opacity")).toFixed(2)).to.equal("0.60")

        vm.a = 8
        setTimeout(function () {
            expect(el.css("opacity")).to.equal("1")
            done()
        })
    })

})

describe('attr', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement("div")
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it("checked", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <input type='radio' ms-controller="attr1" ms-attr-checked="a" >
             */
        })
        vm = avalon.define({
            $id: "attr1",
            a: true
        })
        avalon.scan(div, vm)
        var el = div.children[0]

        expect(el.checked).to.equal(true)
        vm.a = false
        setTimeout(function () {
            expect(el.checked).to.equal(false)

            fireClick(div.children[0])
            setTimeout(function () {
                expect(el.checked + "1").to.equal("true1")
                done()
            }, 100)

        }, 100)
    })

    it("readOnly", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <input ms-attr-disabled=b ms-controller="attr2" ms-attr-readonly="a" >
             */
        })
        vm = avalon.define({
            $id: "attr2",
            a: true,
            b: true
        })
        avalon.scan(div, vm)
        var el = div.children[0]

        expect(el.readOnly).to.equal(true)
        expect(el.disabled).to.equal(true)

        vm.a = false
        vm.b = false
        setTimeout(function () {
            expect(el.readOnly).to.equal(false)
            expect(el.disabled).to.equal(false)
            done()
        }, 100)
    })

    it("selected", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <select ms-controller=attr3 ms-attr-multiple=b>
             <option>000</option>
             <option ms-attr-selected=a>111</option>
             <option>222</option>
             <option>333</option>
             </select>
             */
        })
        vm = avalon.define({
            $id: "attr3",
            a: true,
            b: true
        })
        avalon.scan(div, vm)
        var opts = div.getElementsByTagName("option")
        expect(div.children[0].multiple).to.equal(true)
        expect(opts[1].selected).to.equal(true)
        expect(div.children[0].type).to.equal("select-multiple")

        vm.a = false
        vm.b = false
        setTimeout(function () {
            expect(div.children[0].multiple).to.equal(false)
            expect(div.children[0].type).to.equal("select-one")
            expect(opts[1].selected).to.equal(false)
            done()

        }, 100)
    })


    it("contentEditable", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='attr4' ms-attr-contenteditable='e'>ddd</div>
             */
        })
        vm = avalon.define({
            $id: "attr4",
            e: "true"
        })
        avalon.scan(div, vm)
        var el = div.children[0]

        expect(el.contentEditable).to.equal("true")
        vm.e = "false"
        setTimeout(function () {
            expect(el.contentEditable).to.equal("false")
            done()

        }, 100)
    })
})

describe('visible', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement("div")
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it("inline-block", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='visible' >
             <div style='display:inline-block' ms-visible=a></div>
             <table ms-visible=a><tr ms-visible=a><td ms-visible=a>111</td></tr></table>
             </div>
             */
        })
        vm = avalon.define({
            $id: "visible",
            a: true
        })
        avalon.scan(div, vm)
        var c = div.children[0].children
        var tr = div.getElementsByTagName("tr")[0]
        var td = div.getElementsByTagName("td")[0]

        expect(c[0].style.display).to.equal("inline-block")
        expect(c[1].style.display).to.equal("table")
        expect(tr.style.display).to.equal("table-row")
        expect(td.style.display).to.equal("table-cell")
        vm.a = false
        setTimeout(function () {
            expect(c[0].style.display).to.equal("none")
            expect(c[1].style.display).to.equal("none")
            expect(tr.style.display).to.equal("none")
            expect(td.style.display).to.equal("none")
            vm.a = true
            setTimeout(function () {
                expect(c[0].style.display).to.equal("inline-block")
                expect(c[1].style.display).to.equal("table")
                expect(tr.style.display).to.equal("table-row")
                expect(td.style.display).to.equal("table-cell")
                done()
            })
        })

    })
})



describe('if', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement("div")
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it("test", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='if'>
             <p ms-if='a' >{{aa}}</p>
             <p ms-if='!a' >{{bb}}</p>
             </div>
             */
        })
        vm = avalon.define({
            $id: "if",
            a: true,
            aa: "第一页面",
            bb: "第二页面"
        })
        avalon.scan(div, vm)

        var ps = div.getElementsByTagName("p")
        expect(ps[0].innerHTML).to.equal('第一页面')
        vm.a = false
        setTimeout(function () {
            ps = div.getElementsByTagName("p")
            expect(ps[0].innerHTML).to.equal('第二页面')
            vm.a = true

            setTimeout(function () {
                ps = div.getElementsByTagName("p")
                expect(ps[0].innerHTML).to.equal('第一页面')
                done()
            })

        })
    })
})

describe('html', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement("div")
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it("test", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='html' ms-html='a' >111
             </div>
             */
        })
        vm = avalon.define({
            $id: "html",
            a: "<p ms-html='b'>xxx</p>",
            b: "<b title='yyyy'>zzzzz</b><a>xx</a>",
            d: "<i>司徒正美</i>"
        })
        avalon.scan(div, vm)
        expect(div.children[0].innerHTML).to.equal('<p ms-html="b"><b title="yyyy">zzzzz</b><a>xx</a></p>')
        vm.b = '<span>{{d}}</span>'
        setTimeout(function () {
            expect(div.children[0].innerHTML).to.equal(
                    '<p ms-html="b"><span>&lt;i&gt;司徒正美&lt;/i&gt;</span></p>'
                    )
            done()
        })

    })
})
describe('on', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement("div")
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it("test", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='on' ms-click='a' data-aaa=eee >111
             <div ms-click=b($event,111) id='a111'>
             
             </div>
             </div>
             */
        })
        var index = 1
        vm = avalon.define({
            $id: 'on',
            a: function (e) {
                index++
                expect(e.currentTarget.getAttribute("data-aaa")).to.equal('eee')
            },
            b: function (e, b) {
                index++
                expect(e.type).to.equal("click")
                expect(b).to.equal(111)
            }
        })
        avalon.scan(div, vm)
        var elem = document.getElementById("a111")
        fireClick(elem)
        setTimeout(function () {
            expect(index).to.equal(3)
            done()
        })
    })

    it("stopPropagation", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='on2' ms-click='a' data-aaa=eee >111
             <div ms-click=b($event,33) id='a222'>
             
             </div>
             </div>
             */
        })
        var index = 1
        vm = avalon.define({
            $id: 'on2',
            a: function (e) {
                index++
            },
            b: function (e, b) {
                index++
                expect(e.type).to.equal("click")
                expect(b).to.equal(33)
                e.stopPropagation()
            }
        })
        avalon.scan(div, vm)
        var elem = document.getElementById("a222")
        fireClick(elem)
        setTimeout(function () {
            expect(index).to.equal(2)
            done()
        })
    })

    it("stop:filter", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='on3' ms-click='a' data-aaa=eee >111
             <div ms-click="b($event,33) |stop" id='a222'>
             
             </div>
             </div>
             */
        })
        var index = 1
        vm = avalon.define({
            $id: 'on3',
            a: function (e) {
                index++
            },
            b: function (e, b) {
                index++
                expect(e.type).to.equal("click")
                expect(b).to.equal(33)
            }
        })
        avalon.scan(div, vm)
        var elem = document.getElementById("a222")
        fireClick(elem)
        setTimeout(function () {
            expect(index).to.equal(2)
            done()
        })
    })
})

