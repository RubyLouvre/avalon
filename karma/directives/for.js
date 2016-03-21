var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}

describe('for', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('简单的一维数组循环,一维对象循环,使用注释实现循环', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='for0' >
             <ul>
             <li ms-for='($index, el) in @array | limitBy(4)'>{{$index}}::{{el}}</li>
             </ul>
             <ol><!--ms-js: var $index = 0; -->
             <li ms-for='($key, $val) in @object'>{{$key}}::{{$val}}::{{$index++}}</li>
             </ol>
             <!--ms-for: ($index,el) in @array   -->
             <!--ms-js: if($index > 3){ return }-->
             <p>{{el}}</p>
             <!--ms-for-end:-->
             </div>
             */
        })
        vm = avalon.define({
            $id: 'for0',
            array: [1, 2, 3, 4, 5],
            object: {
                a: 11,
                b: 22,
                c: 33,
                d: 44,
                e: 55
            }
        })
        avalon.scan(div)
        setTimeout(function () {
            var lis = div.getElementsByTagName('li')
            var ps = div.getElementsByTagName('p')
            expect(lis[0].innerHTML).to.equal('0::1')
            expect(lis[1].innerHTML).to.equal('1::2')
            expect(lis[2].innerHTML).to.equal('2::3')
            expect(lis[3].innerHTML).to.equal('3::4')
            expect(lis[4].innerHTML).to.equal('a::11::0')
            expect(lis[5].innerHTML).to.equal('b::22::1')
            expect(lis[6].innerHTML).to.equal('c::33::2')
            expect(lis[7].innerHTML).to.equal('d::44::3')
            expect(lis[8].innerHTML).to.equal('e::55::4')
            expect(ps[0].innerHTML).to.equal('1')
            expect(ps[1].innerHTML).to.equal('2')
            expect(ps[2].innerHTML).to.equal('3')
            expect(ps[3].innerHTML).to.equal('4')
            vm.array.reverse()
            vm.array.unshift(9)
            setTimeout(function () {
                expect(lis[0].innerHTML).to.equal('0::9')
                expect(lis[1].innerHTML).to.equal('1::5')
                expect(lis[2].innerHTML).to.equal('2::4')
                expect(lis[3].innerHTML).to.equal('3::3')
                expect(ps[0].innerHTML).to.equal('9')
                expect(ps[1].innerHTML).to.equal('5')
                expect(ps[2].innerHTML).to.equal('4')
                expect(ps[3].innerHTML).to.equal('3')
                done()
            })
        })
    })
})