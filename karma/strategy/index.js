
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

        it('remove empty text node', function () {
            var f = document.createElement('div')
            f.appendChild(document.createTextNode('xxx'))
            var p = document.createElement('p')
            p.setAttribute(':for', 'el in @arr')
            f.appendChild(p)
            f.appendChild(document.createTextNode(''))
            f.appendChild(document.createTextNode('&nbsp;'))
            var a = avalon.scan.dom2vdom(f)
            expect(f.childNodes.length).to.equal(5)
            expect(a.children.length).to.equal(5)


        })

        it('selectedIndex', function (done) {
            div.innerHTML = heredoc(function () {
                /*
                 <select>
                 <option>1</option>
                 <option selected >2</option>
                 <option>3</option>
                 </select>
                 */
            })
            avalon.scan.dom2vdom(div)
            var select = div.children[0]

            expect(select.selectedIndex).to.equal(1)
            done()
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
