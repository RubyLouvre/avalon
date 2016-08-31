
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
        it('自动为table为tbody', function () {
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
        it('自动移除option下面的标签', function () {
            var str = heredoc(function () {
                /*
                 <select ms-controller="render2">
                 <option><span>111</span><i>222</i></option>
                 <option><span><span>222</span></span></option>
                 </select>
                 */
            })
            var select = avalon.speedUp(avalon.lexer(str))[0]

            expect(select.children[0].children[0].nodeValue).to.equal('111222')
            expect(select.children[1].children[0].nodeValue).to.equal('222')

        })
        it('将textarea里面的内容变成value', function () {
            var str = heredoc(function () {
                /*
                 
                 <textarea ms-controller="render3"><span>333</span></textarea>
                 
                 */
            })
            var textarea = avalon.speedUp(avalon.lexer(str))[0]

            expect(textarea.children.length).to.equal(0)
            expect(textarea.props.value).to.equal('<span>333</span>')

        })
        it('将script/noscript/xmp/template的内容变成文本节点', function () {
            var str = heredoc(function () {
                /*
                 <div ms-controller="render4">
                 <script><span>333</span></script>
                 <noscript><span>333</span></noscript>
                 <xmp><span>333</span></xmp>
                 <template><span>333</span></template>
                 </div>
                 */
            })
            var div = avalon.speedUp(avalon.lexer(str))[0]

            expect(div.children.length).to.equal(4)
            var c = div.children
            expect(c[0].children[0].nodeValue).to.equal('<span>333</span>')
            expect(c[1].children[0].nodeValue).to.equal('<span>333</span>')
            expect(c[2].children[0].nodeValue).to.equal('<span>333</span>')
//            expect(c[3].children[0].nodeValue).to.equal('<span>333</span>')
        })
    })



})
