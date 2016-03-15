var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
describe('css', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('background', function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='css1' ms-css='{background: @a}'>测试样式</div>
             */
        })

        vm = avalon.define({
            $id: 'css1',
            a: 'red'
        })
        avalon.scan(div)
        var css = div.children[0].style
        expect(css.backgroundColor).to.equal('red')

        vm.a = '#a9ea00'
        setTimeout(function () {
            expect(css.backgroundColor).to.match(/#a9ea00|rgb\(169, 234, 0\)/)
            vm.a = '#cdcdcd'
            setTimeout(function () {
                expect(css.backgroundColor).to.match(/#cdcdcd|rgb\(205, 205, 205\)/)
                done()
            }, 100)
        }, 100)

    })

    it('float', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='css2' ms-css='{float:@a}'>测试样式</div>
             */
        })

        vm = avalon.define({
            $id: 'css2',
            a: 'right'
        })

        avalon.scan(div)
        var css = div.children[0].style
        expect(css['float']).to.equal('right')

        vm.a = 'left'
        vm.a = 'right'
        vm.a = 'left'
        setTimeout(function () {
            expect(css['float']).to.equal('left')
            done()
        })

    })
    it('width', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='css3' ms-css="{width: @a}">测试样式</div>
             */
        })

        vm = avalon.define({
            $id: 'css3',
            a: 100
        })

        avalon.scan(div)

        expect(avalon(div.children[0]).width()).to.equal(100)
        expect(div.children[0].style.width).to.equal('100px')
        vm.a = 150
        setTimeout(function () {
            expect(avalon(div.children[0]).width()).to.equal(150)
            expect(div.children[0].style.width).to.equal('150px')

            done()
        })
    })

    it('opacity', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='css4' ms-css='{opacity:@a}'>测试样式</div>
             */
        })
        vm = avalon.define({
            $id: 'css4',
            a: 0.6
        })
        avalon.scan(div)
        var el = avalon(div.children[0])
        expect(Number(el.css('opacity')).toFixed(2)).to.equal('0.60')

        vm.a = 8
        setTimeout(function () {
            expect(el.css('opacity')).to.equal('1')
            done()
        })
    })

})