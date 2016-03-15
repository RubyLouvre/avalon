var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}

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
             <p ms-if='@a' >{{aa}}</p>
             <p ms-if='!@a' >{{bb}}</p>
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
