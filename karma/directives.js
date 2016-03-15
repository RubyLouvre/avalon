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

