var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
describe('important', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('test', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="wrapper">
             <div ms-important="important1">{{@aaa}}</div>
             </div>
             */
        })
        avalon.define({
            $id: 'wrapper',
            aaa: 111
        })
        vm = avalon.define({
            $id: 'important1',
            aaa: 111
        })
        avalon.scan(div)
        expect(div.innerText || div.textContent).to.equal('111')
        setTimeout(function () {
            vm.aaa = 222
            setTimeout(function () {
                expect(div.innerText || div.textContent).to.equal('222')
                done()
            })

        })

    })
})
