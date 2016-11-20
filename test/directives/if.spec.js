import { avalon } from '../../src/seed/core'

describe('if', function() {
    var body = document.body,
        div, vm
    beforeEach(function() {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function() {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it('test', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='if1' ms-if='@aaa' class='ms-controller' >111
             </div>
             */
        })
        vm = avalon.define({
            $id: 'if1',
            aaa: false
        })
        avalon.scan(div)
        setTimeout(function() {
            expect(div.innerHTML).toMatch(/\<\!\-\-/)
            vm.aaa = true
            setTimeout(function() {
                expect(div.innerHTML).not.toMatch(/\<\!\-\-/)
                expect(div.innerHTML).toMatch(/111/)
                var dd = div.getElementsByTagName('div')[0]
                expect(dd.className).toBe('')
                done()
            }, 100)
        }, 100)

    })
})