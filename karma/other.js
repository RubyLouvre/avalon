var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
describe('节点对齐算法', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('avalon.innerHTML', function () {
        vm = {$id: 'test'}
        var table = document.createElement('table')
        div.appendChild(table)
        avalon.innerHTML(table, '<tr><td>111</td></tr>')
        expect(table.getElementsByTagName('td').length).to.equal(1)
    })


})