var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
describe('core', function () {
    it('new avalon', function () {
        var body = document.body
        var el = avalon(body)
        expect(el).to.be.instanceof(avalon)
        expect(el[0]).to.be.equal(body)
        expect(el.element).to.be.equal(body)
    })
    it('fn', function () {
        expect(avalon.fn).to.equal(avalon.prototype)
    })
    it('noop', function () {

        expect(avalon.noop).to.a('function')

    })
    it('shadowCopy', function () {
        var a = {}
        var b = {aa: 1, bb: 1}
        expect(avalon.shadowCopy).to.be.a('function')
        expect(avalon.shadowCopy(a, b)).to.be.eql(b)
    })
    it('rword', function () {

        expect(avalon.rword).to.be.a('regexp')
    })
    it('inspect', function () {
        var a = avalon.inspect
        expect(a).to.be.a('function')
        expect(a).to.be.equal(Object.prototype.toString)
        expect(a.call('')).to.equal('[object String]')
        expect(a.call([])).to.equal('[object Array]')
        expect(a.call(1)).to.equal('[object Number]')
        expect(a.call(new Date())).to.equal('[object Date]')
        expect(a.call(/test/)).to.equal('[object RegExp]')
    })

    it('ohasOwn', function () {

        expect(avalon.ohasOwn).to.be.a('function')
        expect(avalon.ohasOwn).to.be.equal(Object.prototype.hasOwnProperty)
    })
    it('log', function () {

        expect(avalon.log).to.be.a('function')
    })
    it('warn', function () {

        expect(avalon.warn).to.be.a('function')
    })
    it('error', function () {

        expect(avalon.error).to.be.a('function')
    })
    it('oneObject', function () {

        expect(avalon.oneObject).to.be.a('function')
        expect(avalon.oneObject('aa,bb,cc')).to.eql({
            aa: 1,
            bb: 1,
            cc: 1
        })
        expect(avalon.oneObject([1, 2, 3], false)).to.eql({
            1: false,
            2: false,
            3: false
        })
    })
})






