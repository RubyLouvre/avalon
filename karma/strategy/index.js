
describe('测试strategy模块', function () {

    describe('dom2vdom', function () {
        var body = document.body, div, vm
        beforeEach(function () {
            div = document.createElement('div')
            body.appendChild(div)
        })
        afterEach(function () {
            body.removeChild(div)
            if (vm) {
                delete avalon.vmodels[vm.$id]
            }
        })

        it('avalon.scan', function (done) {
            div.innerHTML = heredoc(function () {
                /*
                 <table ms-controller="render1">
                 <tr id='tbodyChild' ms-for="el in @arr"><td>222</td></tr>
                 </table>
                 <span>222</span> <span>  </span>
                 */
            })
            var table = div.getElementsByTagName('table')[0]

            vm = avalon.define({
                $id: 'render1',
                arr: [1, 2, 3]
            })
            avalon.scan(div)

            setTimeout(function () {
                expect(table.getElementsByTagName('tbody').length).to.equal(1)
                expect(table.getElementsByTagName('tr').length).to.equal(3)
                done()
            }, 300)
        })
    })

    describe('text2vdom', function () {
        it('avalon.lexer', function () {
            var str = heredoc(function () {
                /*
                 <table ms-controller="render1">
                 <tr id='tbodyChild' ms-for="el in @arr"><td>222</td></tr>
                 </table>
                 <span>222</span> <span>  </span>
                 */
            })
            var nodes = avalon.speedUp(avalon.lexer(str))
            var f = avalon.vdom(nodes, 'toDOM')
            expect(f.childNodes.length).to.equal(3)
            var table = f.childNodes[0]
            expect(table.getElementsByTagName('tbody').length).to.equal(1)
        })


    })
})
