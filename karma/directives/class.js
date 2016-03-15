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
describe('class', function () {
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
             <ul ms-controller='class1' >
             <li ms-class='@aa'></li>
             <li ms-class="[@bb,'e','f']"></li>
             <li ms-class='@cc' class="e"></li>
             </ul>
             */
        })
        vm = avalon.define({
            $id: 'class1',
            aa: {a: 1, b: 1, c: 0},
            bb: 'd',
            cc: 'a b c'
        })
        avalon.scan(div)
        var lis = div.getElementsByTagName('li')
        expect(lis.length).to.equal(3)
        expect(lis[0].className).to.equal('a b')
        expect(lis[1].className).to.equal('d e f')
        expect(lis[2].className).to.equal('e a b c')
        vm.aa = {
            a: 0,
            b: 1,
            c: 1
        }
        vm.bb = 'z'
        vm.cc = 'aa bb'
        setTimeout(function () {
            expect(lis[0].className).to.equal('b c')
            expect(lis[1].className).to.equal('z e f')
            expect(lis[2].className).to.equal('e aa bb')
            done()
        })

    })
})