var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}

describe('text', function () {
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
             <div ms-controller='text1' ms-text='@aa'>{{@bb}}</div>
             */
        })
        vm = avalon.define({
            $id: 'text1',
            aa: '清风炎羽',
            bb: '司徒正美'
        })
        avalon.scan(div)
        expect(div.children[0].innerHTML).to.equal('清风炎羽')
        vm.aa = '新的内容'
        setTimeout(function () {
            expect(div.children[0].innerHTML).to.equal('新的内容')
            done()
        })

    })
})