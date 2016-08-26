describe('vdom', function () {
  var vdom = avalon.vdom
  describe('VElement', function () {
        it('test', function () {
            var el = new vdom.VElement('p', {title: '111'}, [])
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
            expect(el.type || el.nodeName).to.equal('#comment')
        })
    })
    
     describe('VFragment', function () {

        it('test', function () {
            var el = new vdom.VFragment([])
            expect(el).to.be.instanceof(vdom.VFragment)
            expect(el).to.have.property('toDOM')
            expect(el).to.have.property('toHTML')
            expect(el.children).to.eql([])
            expect(el.type || el.nodeName).to.equal('#document-fragment')
        })
    })

    describe('VText', function () {
        it('test', function () {
            var el = new vdom.VText('aaa')
            expect(el).to.be.instanceof(vdom.VText)
            expect(el).to.have.property('toDOM')
            expect(el).to.have.property('toHTML')
            expect(el.nodeValue).to.equal('aaa')
            expect(el.type || el.nodeName).to.equal('#text')
        })
    })


    describe('vdomAdaptor', function () {
        it('test', function () {
            expect(avalon.vdom).to.be.a('function')
        })
    })
})