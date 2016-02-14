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
describe('class', function() {

    var body = document.body, div, vm
    beforeEach(function() {
        div = document.createElement("div")
        body.appendChild(div)
    })
    var style = document.createElement("style")
    var cssText = heredoc(function() {
        /*
         .red{ background: red}
         .aaa{ background: green}
         .green{background: rgb(50,205,50)}
         .xxxred{ background: pink}
         .xxxgreen{ background: rgb(85,107,47)}
         */
    })
    body.appendChild(style)
    try {
        style.styleSheet.cssText += cssText
    } catch (e) {
        style.innerHTML = cssText
    }
    afterEach(function() {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it("test", function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="class1" >
             <p ms-class="{{aaa}}">sss</p>
             <p ms-class="aaa">sss</p>
             <p ms-class="aaa:toggle">sss</p>
             <p ms-class-aaa="toggle">sss</p>
             <p ms-class="xxx{{aaa}}">sss</p>
             
             </div>
             */
        })
        vm = avalon.define({
            $id: 'class1',
            aaa: "red",
            toggle: true

        })
        avalon.scan(div, vm)
        var ps = div.getElementsByTagName("p")

        expect(avalon(ps[0]).css("background-color")).to.equal("rgb(255, 0, 0)")
        expect(avalon(ps[1]).css("background-color")).to.equal("rgb(0, 128, 0)")
        expect(avalon(ps[2]).css("background-color")).to.equal("rgb(0, 128, 0)")
        expect(avalon(ps[3]).css("background-color")).to.equal("rgb(0, 128, 0)")
        expect(avalon(ps[4]).css("background-color")).to.equal("rgb(255, 192, 203)")
        vm.aaa = "green"

        setTimeout(function() {
            expect(ps[0].className).to.equal("green")
            expect(avalon(ps[0]).css("background-color")).to.equal("rgb(50, 205, 50)")
            expect(ps[4].className).to.equal("xxxgreen")
            expect(avalon(ps[4]).css("background-color")).to.equal("rgb(85, 107, 47)")
            vm.toggle = false
            setTimeout(function() {
                expect(ps[2].className).to.equal("")
                expect(avalon(ps[2]).css("background-color")).to.equal("rgba(0, 0, 0, 0)")
                expect(ps[3].className).to.equal("")
                expect(avalon(ps[3]).css("background-color")).to.equal("rgba(0, 0, 0, 0)")
                done()
            }, 80)

        }, 80)

    })
})