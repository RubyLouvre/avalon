var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
describe('attr', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('checked', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <input type='radio' ms-controller='attr1' ms-attr='{checked:@a}' >
             */
        })
        vm = avalon.define({
            $id: 'attr1',
            a: true
        })
        avalon.scan(div)
        var el = div.children[0]

        expect(el.checked).to.equal(true)
        vm.a = false
        setTimeout(function () {
            expect(el.checked).to.equal(false)

            fireClick(div.children[0])
            setTimeout(function () {
                expect(el.checked + '1').to.equal('true1')
                done()
            }, 100)

        }, 100)
    })

    it('readOnly', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <input ms-controller='attr2' ms-attr='{readonly: @a,disabled:@b}' >
             */
        })
        vm = avalon.define({
            $id: 'attr2',
            a: true,
            b: true
        })
        avalon.scan(div)
        var el = div.children[0]

        expect(el.readOnly).to.equal(true)
        expect(el.disabled).to.equal(true)

        vm.a = false
        vm.b = false
        setTimeout(function () {
            expect(el.readOnly).to.equal(false)
            expect(el.disabled).to.equal(false)
            done()
        }, 100)
    })

    it('selected', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <select ms-controller='attr3' ms-attr='{multiple:@a}'>
             <option>000</option>
             <option ms-attr='{selected:@b}'>111</option>
             <option>222</option>
             <option>333</option>
             </select>
             */
        })
        vm = avalon.define({
            $id: 'attr3',
            a: true,
            b: true
        })
        avalon.scan(div)
        var opts = div.getElementsByTagName('option')
        expect(div.children[0].multiple).to.equal(true)
        expect(opts[1].selected).to.equal(true)
        expect(div.children[0].type).to.equal('select-multiple')

        vm.a = false
        vm.b = false
        setTimeout(function () {
            expect(div.children[0].multiple).to.equal(false)
            expect(div.children[0].type).to.equal('select-one')
            expect(opts[1].selected).to.equal(false)
            done()

        }, 100)
    })

    it('contentEditable', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='attr4' ms-attr='{contenteditable:@a}'>ddd</div>
             */
        })
        vm = avalon.define({
            $id: 'attr4',
            a: 'true'
        })
        avalon.scan(div)
        var el = div.children[0]

        expect(el.contentEditable).to.equal('true')
        vm.a = 'false'
        setTimeout(function () {
            expect(el.contentEditable).to.equal('false')
            done()

        }, 100)
    })

    it("value", function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <input ms-controller='attr5' ms-attr='{value:@a}'>
             */
        })

        vm = avalon.define({
            $id: "attr5",
            a: "司徒正美"
        })

        avalon.scan(div)
        expect(div.children[0].value).to.equal("司徒正美")
        vm.a = "新的值"
        setTimeout(function () {
            expect(div.children[0].value).to.equal("新的值")
            done()
        })


    })

})