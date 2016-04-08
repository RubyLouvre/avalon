var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}


describe('visible', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it('inline-block', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='visible' >
             <div style='display:inline-block' ms-visible='@a'></div>
             <table ms-visible='@a'><tr ms-visible='@a'><td ms-visible='@a'>111</td></tr></table>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'visible',
            a: true
        })
        avalon.scan(div)
        var c = div.children[0].children
        var tr = div.getElementsByTagName('tr')[0]
        var td = div.getElementsByTagName('td')[0]

        expect(c[0].style.display).to.equal('inline-block')
        expect(c[1].style.display).to.equal('')
        expect(tr.style.display).to.equal('')
        expect(td.style.display).to.equal('')
        vm.a = false
        setTimeout(function () {
            expect(c[0].style.display).to.equal('none')
            expect(c[1].style.display).to.equal('none')
            expect(tr.style.display).to.equal('none')
            expect(td.style.display).to.equal('none')
            vm.a = true
            setTimeout(function () {
                expect(c[0].style.display).to.equal('inline-block')
                expect(c[1].style.display).to.equal('')
                expect(tr.style.display).to.equal('')
                expect(td.style.display).to.equal('')
                done()
            })
        })

    })
})