function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}

function fireClick(el) {
    if (el.click) {
        el.click()
    } else {
//https://developer.mozilla.org/samples/domref/dispatchEvent.html
        var evt = document.createEvent('MouseEvents')
        evt.initMouseEvent('click', true, true, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
        !el.dispatchEvent(evt);
    }
}
describe('validate', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('deduplicateInValidateAll:', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <form ms-validate="@validate" ms-controller='validate1' action="javascript: void(0)">
             <p>
             <input ms-duplex="@aaa" placeholder="username" ms-rules='{required:true,chs:true}'>{{@aaa}}</p>
             <p>
             <input type="password" id="pw" placeholder="password" ms-rules='{required:true}' ms-duplex="@bbb" />
             </p>
             <p>
             <input type="password" ms-rules='{required:true,equalto:"pw"}' placeholder="再填一次" ms-duplex="@ccc | change" />
             </p>
             <p>
             <button type="submit" >submit</button>
             </p>
             </form>
             */
        })
        var callback = sinon.spy()
        var error = sinon.spy()
        vm = avalon.define({
            $id: "validate1",
            aaa: '',
            bbb: '',
            ccc: '',
            validate: {
                onError: error,
                deduplicateInValidateAll: true,
                onValidateAll: callback,
                validateInKeyup: false
            }
        })
        avalon.scan(div)
        vm.aaa = '1234'
        vm.bbb = 111
        vm.ccc = 111
        var btn = div.getElementsByTagName('button')[0]
        fireClick(btn)
        setTimeout(function () {
            expect(callback.called).to.equal(true)
            var first = callback.args[0][0]
            expect(first.length).to.equal(1)

            expect(first[0].getMessage()).to.equal('必须是中文字符')
            expect(first[0].message).to.equal('必须是中文字符')

            expect(error.called).to.equal(false)

            vm.aaa = "司徒正美"
            fireClick(btn)
            setTimeout(function () {
                expect(callback.callCount).to.equal(2)
                expect(callback.args[1][0].length).to.equal(0)
                done()
            },300)

        })
    })



})