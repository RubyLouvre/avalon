
import { avalon } from '../../src/seed/core'

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

        expect(el.checked).toBe(true)
        vm.a = false
        setTimeout(function () {
            expect(el.checked).toBe(false)

            vm.a = true
            setTimeout(function () {
                expect(el.checked + '1').toBe('true1')
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

        expect(el.readOnly).toBe(true)
        expect(el.disabled).toBe(true)

        vm.a = false
        vm.b = false
        setTimeout(function () {
            expect(el.readOnly).toBe(false)
            expect(el.disabled).toBe(false)
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
        expect(div.children[0].multiple).toBe(true)
        expect(opts[1].selected).toBe(true)
        expect(div.children[0].type).toBe('select-multiple')

        vm.a = false
        vm.b = false
        setTimeout(function () {
            expect(div.children[0].multiple).toBe(false)
            expect(div.children[0].type).toBe('select-one')
            expect(opts[1].selected).toBe(false)
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

        expect(el.contentEditable).toBe('true')
        vm.a = 'false'
        setTimeout(function () {
            expect(el.contentEditable).toBe('false')
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
        expect(div.children[0].value).toBe("司徒正美")
        vm.a = "新的值"
        setTimeout(function () {
            expect(div.children[0].value).toBe("新的值")
            done()
        })


    })

    it("toggle", function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <input ms-controller='attr6' ms-attr='[@toggle && @active]'>
             */
        })

        vm = avalon.define({
            $id: "attr6",
            toggle: false,
            active: {
                title: 'active'
            }
        })

        avalon.scan(div)
        expect(div.children[0].title).toBe('')
        vm.toggle = true
        setTimeout(function () {
            expect(div.children[0].title).toBe('active')
            vm.toggle = false
            setTimeout(function () {
                expect(div.children[0].title).toBe('')
            
                done()
            })
        })

    })
    
    it('复制对象指令的处理', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='attr7' :attr="{title: @aaa||@aaa}" :rules="{ required: true, minlength:4 }">ddd</div>
             */
        })
        vm = avalon.define({
            $id: 'attr7',
            aaa: '111'
        })
        avalon.scan(div)
        var el = div.children[0]

        expect(el.title).toBe('111')
        done()
    })

})