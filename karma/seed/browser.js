
describe('测试browser文件的API', function () {

    it('document', function () {
        expect(typeof avalon.document).to.equal('object')
    })


    it('window', function () {
        expect(avalon).have.property('window')
    })


    it('root', function () {
        expect(avalon).to.have.property('root')
    })


    it('avalonDiv', function () {
        expect(avalon).to.have.property('avalonDiv')
    })


    it('avalonFragment', function () {
        expect(avalon).to.have.property('avalonFragment')
    })


    it('msie', function () {
        expect(avalon.msie).to.be.a('number')
    })


    it('modern', function () {
        expect(avalon.modern).to.be.a('boolean')
    })


    it('browser', function () {
        expect(avalon.browser).to.be.a('boolean')
    })

})