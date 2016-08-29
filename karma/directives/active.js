var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}

describe('active', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it('test', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='hover1' ms-active='@aaa' >111
             </div>
             */
        })
        vm = avalon.define({
            $id: 'hover1',
            aaa: 'h'
        })
        avalon.scan(div)
        var el = div.getElementsByTagName('div')[0]
        var v = el.getAttribute('avalon-events')
        var map = {}
        v.replace(/[^,]+/g, function (vv) {
            var arr = vv.split(':')
            map[arr[0]] = arr[1]
        })
        expect(Object.keys(map).sort()).to.eql(['mousedown', 'mouseleave','mouseup'])
        var fn = avalon.eventListeners[map.mousedown]
        fn({
            type: 'mousedown',
            target: el
        })
        expect(avalon(el).hasClass('h')).to.equal(true)
        fn = avalon.eventListeners[map.mouseup]
        fn({
            type: 'mouseup',
            target: el
        })
        expect(avalon(el).hasClass('h')).to.equal(false)
        done()

    })
})