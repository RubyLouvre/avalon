import { avalon } from '../../src/seed/core'

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
        expect(lis.length).toBe(3)
        expect(lis[0].className).toBe('a b')
        expect(lis[1].className).toBe('d e f')
        expect(lis[2].className).toBe('e a b c')
        vm.aa = {
            a: 0,
            b: 1,
            c: 1
        }
        vm.bb = 'z'
        vm.cc = 'aa bb'
        setTimeout(function () {
            expect(lis[0].className).toBe('b c')
            expect(lis[1].className).toBe('z e f')
            expect(lis[2].className).toBe('e aa bb')
            done()
        })

    })
})