
describe('visible', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    
    it('parseDisplay', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <table class="ddd" ms-controller="visible2" ms-visible="@a">
             <tr><td>222</td></tr>
             </table>
             <style>
             .ddd{display:none;color:rgb(211, 0, 200);}
             kbd{display: none }
             </style>
             */
        })
        var kbd = avalon.parseDisplay(document.createElement('kbd'))
        expect(kbd).toBe('block')
        vm = avalon.define({
            $id: 'visible2',
            a: true
        })
        avalon.scan(div)
        setTimeout(function () {//1
            avalon.log(avalon(div.firstChild).css('display'),'visible spec')
            expect(avalon(div.firstChild).css('display')).not.toBe('none')
            done()
        })
    })
    
    it('inline-block', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='visible' >
             <div style='display:inline-block' ms-visible='@a'></div>
             <table ms-visible='@a'><tr ms-visible='@a'><td ms-visible='@a'>111</td></tr></table>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'visible',
            a: true
        })
        avalon.scan(div)
        var c = div.children[0].children
        var tr = div.getElementsByTagName('tr')[0]
        var td = div.getElementsByTagName('td')[0]

        expect(c[0].style.display).toBe('inline-block')//4
        expect(c[1].style.display).toBe('')
        expect(tr.style.display).toBe('')
        expect(td.style.display).toBe('')
        vm.a = false//8
        setTimeout(function () {
            expect(c[0].style.display).toBe('none')
            expect(c[1].style.display).toBe('none')
            expect(tr.style.display).toBe('none')
            expect(td.style.display).toBe('none')
            vm.a = true//12
            setTimeout(function () {
                expect(c[0].style.display).toBe('inline-block')
                expect(c[1].style.display).toBe('')
                expect(tr.style.display).toBe('')
                expect(td.style.display).toBe('')
                done()
            })
        })

    })

})