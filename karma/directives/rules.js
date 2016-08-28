
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
describe('effect', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('required', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="validate1">
             <form ms-validate="@validate" action='javascript:void(0)'>
             <p><input ms-duplex="@aaa" ms-rules='{required:@ddd}' >{{@aaa}}</p>
             <button type='submit'>dddd</button>
             </form>
             </div>
             */
        })
        var flag = 0
        vm = avalon.define({
            $id: "validate1",
            aaa: "",
            ddd: true,
            validate: {
                onValidateAll: function (reasons) {
                    if (reasons.length) {
                        flag = 1
                    } else {
                        flag = 2
                    }
                }
            }
        })
        avalon.scan(div)
        var btn = div.getElementsByTagName('button')[0]
        fireClick(btn)
        setTimeout(function () {
            expect(flag).to.equal(1)
            setTimeout(function () {
                flag = 0
                vm.aaa = '22'
                fireClick(btn)
                setTimeout(function () {
                    expect(flag).to.equal(2)
                    done()
                })
            })
        })

    })

})
