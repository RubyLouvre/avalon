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


describe('include', function () {
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
             <div ms-controller='include' ms-include='a' 
             data-include-loaded='showloading' 
             data-include-rendered='hideloading'
             ></div>
             <script id=aaa type=avalon><p>{{aa}}</p></script>
             <script id=bbb type=avalon><p>{{bb}}</p></script>
             */
        })
        var index = 0
        vm = avalon.define({
            $id: "include",
            a: 'aaa',
            aa: "第一页面",
            bb: "第二页面",
            hideloading: function () {
                index++
                expect(index).to.equal(2)
                index = 0
            },
            showloading: function (node) {
                expect(node.getAttribute('ms-include')).to.equal('a')
                node.innerHTML = "loading..."
                index++
                expect(index).to.equal(1)

            }
        })
        avalon.scan(div, vm)
        var c = div.children[0]
        
        expect(c.innerHTML).to.equal('<p data-include-id="id:aaa">第一页面</p>')

        vm.a = 'bbb'
        setTimeout(function () {
            expect(c.innerHTML).to.equal('<p data-include-id="id:bbb">第二页面</p>')
            done()
        })

    })
})
