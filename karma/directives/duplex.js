var assert = chai.assert;
var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
function fireClick(el) {
    if (el.click) {
        el.click()
    } else {
//https://developer.mozilla.org/samples/domref/dispatchEvent.html
        var evt = document.createEvent('MouseEvents')
        evt.initMouseEvent('click', true, true, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
        !el.dispatchEvent(evt);
    }
}
describe('duplex', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it('数据转换', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex1' >
             <input ms-duplex='@aaa|string|limitBy(2)'><span>{{@aaa}}</span>
             <input ms-duplex='@bbb|number' ><span>{{@bbb}}</span>
             <input ms-duplex='@ccc|boolean' ><span>{{@ccc}}</span>
             <input ms-duplex='@ddd|checked' type='radio' ><span>{{@ddd}}</span>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex1',
            aaa: 12345,
            bbb: '123a',
            ccc: 'true',
            ddd: true

        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var inputs = div.getElementsByTagName('input')
            var spans = div.getElementsByTagName('span')

            expect(inputs[0].value).to.equal('12')
            expect(vm.aaa).to.equal('12')
            expect(spans[0].innerHTML).to.equal('12')
            expect(inputs[1].value).to.equal('123')
            expect(vm.bbb).to.equal(123)
            expect(spans[1].innerHTML).to.equal('123')
            expect(inputs[2].value).to.equal('true')
            expect(vm.ccc).to.equal(true)
            expect(spans[2].innerHTML).to.equal('true')
            expect(vm.ddd).to.equal(true)
            expect(spans[3].innerHTML).to.equal('true')
            expect(inputs[3].checked).to.equal(true)
            vm.bbb = '333b'
            vm.ccc = 'NaN'
            vm.ddd = false
            setTimeout(function () {
                expect(inputs[1].value).to.equal('333')
                expect(vm.bbb).to.equal(333)
                expect(spans[1].innerHTML).to.equal('333')
                expect(inputs[2].value).to.equal('false')
                expect(vm.ccc).to.equal(false)
                expect(spans[2].innerHTML).to.equal('false')
                expect(spans[3].innerHTML).to.equal('false')
                expect(inputs[3].checked).to.equal(false)
                done()
            }, 100)//chrome 37还是使用定时器，需要延迟足够的时间
        }, 100)

    })
})