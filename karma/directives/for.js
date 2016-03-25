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

    it('双层循环,并且重复利用已有的元素节点', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='for1'>
             <table>
             <tr ms-for='tr in @array'>
             <td ms-for='td in tr'>{{td}}</td>
             </tr>
             </table>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'for1',
            array: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
        })
        avalon.scan(div)
        setTimeout(function () {
            var tds = div.getElementsByTagName('td')

            expect(tds[0].innerHTML).to.equal('1')
            expect(tds[1].innerHTML).to.equal('2')
            expect(tds[2].innerHTML).to.equal('3')
            expect(tds[3].innerHTML).to.equal('4')
            expect(tds[4].innerHTML).to.equal('5')
            expect(tds[5].innerHTML).to.equal('6')
            expect(tds[6].innerHTML).to.equal('7')
            expect(tds[7].innerHTML).to.equal('8')
            expect(tds[8].innerHTML).to.equal('9')
            avalon.each(tds, function (i, el) {
                el.title = el.innerHTML
            })
            vm.array = [[11, 22, 33], [44, 55, 66], [77, 88, 99]]
            setTimeout(function () {

                expect(tds[0].innerHTML).to.equal('11')
                expect(tds[1].innerHTML).to.equal('22')
                expect(tds[2].innerHTML).to.equal('33')
                expect(tds[3].innerHTML).to.equal('44')
                expect(tds[4].innerHTML).to.equal('55')
                expect(tds[5].innerHTML).to.equal('66')
                expect(tds[6].innerHTML).to.equal('77')
                expect(tds[7].innerHTML).to.equal('88')
                expect(tds[8].innerHTML).to.equal('99')

                expect(tds[0].title).to.equal('1')
                expect(tds[1].title).to.equal('2')
                expect(tds[2].title).to.equal('3')
                expect(tds[3].title).to.equal('4')
                expect(tds[4].title).to.equal('5')
                expect(tds[5].title).to.equal('6')
                expect(tds[6].title).to.equal('7')
                expect(tds[7].title).to.equal('8')
                expect(tds[8].title).to.equal('9')
                done()
            })
        })
    })
    it('监听数组长度变化', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <ul ms-controller='for2'>
             <li ms-for='el in @array'>{{el.length}}</li>
             </ul>
             */
        })
        vm = avalon.define({
            $id: 'for2',
            array: [[1, 2], [3, 4, 5]]
        })
        avalon.scan(div)
        setTimeout(function () {
            var lis = div.getElementsByTagName('li')

            expect(lis[0].innerHTML).to.equal('2')
            expect(lis[1].innerHTML).to.equal('3')

            vm.array = [['a', "b", "c", "d"], [3, 4, 6, 7, 8]]
            setTimeout(function () {

                expect(lis[0].innerHTML).to.equal('4')
                expect(lis[1].innerHTML).to.equal('5')
                done()
            })
        })
    })
})