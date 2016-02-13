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
describe('class', function () {
    
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement("div")
        body.appendChild(div)
    })
    var style = document.createElement("style")
    var cssText = heredoc(function(){
        /*
        .red{ background: red}
         */
    })
    body.appendChild(style)
    try{
        style.styleSheet.cssText += cssText
    }catch(e){
        style.innerHTML  = cssText
    }
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it("test", function (done) {
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="class1" >
             <p ms-class="{{aaa}}">sss</p>
            </div>
             */
        })
        vm = avalon.define({
            $id: 'class1',
            aaa: "red"

        })
        avalon.scan(div, vm)
        var ps = div.getElementsByTagName("p")

        expect(avalon(ps[0]).css("background-color")).to.equal("rgb(255, 0, 0)")
        
            done()

    })
})