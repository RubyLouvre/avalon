var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
describe('节点对齐算法', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('在chrome与firefox下删掉select中的空白节点，会影响到selectedIndex', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <!--""-->
             <select ms-controller="reconcile1">
             <option selected="true">111</option>
             <option>222</option>
             <option>333</option>
             <option>444</option>
             </select>
             */
        })
        vm = avalon.define({
            $id: 'reconcile1',
            a: true
        })
        avalon.scan(div)

        setTimeout(function () {
            var el = div.getElementsByTagName('select')[0]
            expect(el.selectedIndex).to.equal(0)
            done()

        }, 100)
    })

    it('当注释节里面包含HTML,HTML里面有属性,就会崩溃BUG', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="reconcile2">
             <!--<div class="xxx"></div>-->
             <span ms-for="el in @arr">
             {{el}}
             </span>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'reconcile2',
            arr: [1, 2, 3]
        })
        avalon.scan(div)
        setTimeout(function () {
            expect(div.getElementsByTagName('span').length).to.equal(3)
            done()
        }, 100)
    })


})