var expect = require('chai').expect
var vdom = require('./index')
describe('vdom', function () {
    describe('VElement', function () {
        it('test', function () {
            var el = new vdom.VElement({type: 'p', props: {title: '111'}, children: []})
            expect(el).to.be.instanceof(vdom.VElement)
            expect(el).to.have.property('toDOM')
            expect(el).to.have.property('toHTML')
        })

    })

    describe('VComment', function () {

        it('test', function () {
            var el = new vdom.VComment('aaa')
            expect(el).to.be.instanceof(vdom.VComment)
            expect(el).to.have.property('toDOM')
            expect(el).to.have.property('toHTML')
            expect(el.nodeValue).to.equal('aaa')
            expect(el.type).to.equal('#comment')
        })
    })

    describe('VText', function () {
        it('test', function () {
            var el = new vdom.VText('aaa')
            expect(el).to.be.instanceof(vdom.VText)
            expect(el).to.have.property('toDOM')
            expect(el).to.have.property('toHTML')
            expect(el.nodeValue).to.equal('aaa')
            expect(el.type).to.equal('#text')
        })
    })


    describe('vdomAdaptor', function () {
        it('test', function () {
            expect(avalon.vdomAdaptor).to.be.a('function')
        })
    })
})
