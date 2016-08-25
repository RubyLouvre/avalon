describe('测试lang.compact/modern文件的API', function () {
    describe('quote', function () {
        it('test', function () {
            expect(avalon.quote).to.be.a('function')
        })
    })

    describe('type', function () {
        it('test', function () {
            var fn = avalon.type
            expect(fn(/e\d+/)).to.equal('regexp')
            expect(fn('sss')).to.equal('string')
            expect(fn(111)).to.equal('number')
            expect(fn(new Error)).to.equal('error')
            expect(fn(Date)).to.equal('function')
            expect(fn(new Date)).to.equal('date')
            expect(fn({})).to.equal('object')
            expect(fn(null)).to.equal('null')
            expect(fn(void 0)).to.equal('undefined')
        })
    })

    describe('isFunction', function () {
        it('test', function () {
            expect(avalon.isFunction(avalon.noop)).to.equal(true)
        })
    })

    describe('isWindow', function () {
        it('test', function () {
            expect(avalon.isWindow(avalon.document)).to.equal(false)
        })
    })

    describe('isPlainObject', function () {
        it('test', function () {
            expect(avalon.isPlainObject({})).to.be.true
            expect(avalon.isPlainObject(new Object)).to.be.true
        })
    })

    describe('mix', function () {
        it('test', function () {
            expect(avalon.mix).to.be.a('function')

        })
    })

    describe('each', function () {
        it('test', function () {
            expect(avalon.each).to.be.a('function')

        })
    })

   
})

describe('测试lang.share文件的API', function () {
    describe('caches', function () {
        it('test', function () {
            expect(avalon.caches).to.be.a('object')
        })
    })
    describe('components', function () {
        it('test', function () {
            expect(avalon.components).to.be.a('object')
        })
    })
    describe('scopes', function () {
        it('test', function () {
            expect(avalon.scopes).to.be.a('object')
        })
    })
    describe('directives', function () {
        it('test', function () {
            expect(avalon.directives).to.be.a('object')
        })
    })
    describe('filters', function () {
        it('test', function () {
            expect(avalon.filters).to.be.a('object')
        })
    })
    describe('vmodels', function () {
        it('test', function () {
            expect(avalon.vmodels).to.be.a('object')
        })
    })
     describe('parsers', function () {
        it('test', function () {
            expect(avalon.vmodels).to.be.a('object')
        })
    })
    describe('eventHooks', function () {
        it('test', function () {
            expect(avalon.eventHooks).to.be.a('object')
        })
    })
    describe('cssHooks', function () {
        it('test', function () {
            expect(avalon.cssHooks).to.be.a('object')
        })
    })
    
    describe('slice', function () {
        it('test', function () {
            expect(avalon.slice([1, 2, 3, 4], 1, 2)).to.eql([2])
        })
    })

    describe('version', function () {
        it('test', function () {
            expect(/\d/.test(avalon.version)).to.be.true
        })
    })
    describe('css', function () {
        it('test', function () {
            expect(avalon.css).to.be.a('function')
        })
    })
    describe('directive', function () {
        it('test', function () {
            expect(avalon.directive).to.be.a('function')
        })
    })

    describe('isObject', function () {
        it('test', function () {
            expect(avalon.isObject({})).to.be.true
            expect(avalon.isObject(avalon.noop)).to.be.false
        })
    })

    describe('range', function () {
        it('test', function () {
            expect(avalon.range).to.be.a('function')
        })
    })

    describe('hyphen', function () {
        it('test', function () {
            expect(avalon.hyphen).to.be.a('function')
        })
    })

    describe('camelize', function () {
        it('test', function () {
            expect(avalon.camelize).to.be.a('function')
        })
    })

    describe('makeHashCode', function () {
        it('test', function () {
            expect(avalon.makeHashCode).to.be.a('function')
        })
    })

    describe('escapeRegExp', function () {
        it('test', function () {
            expect(avalon.escapeRegExp).to.be.a('function')
        })
    })

    describe('Array', function () {
        it('test', function () {
            expect(avalon.Array).to.be.a('object')
            expect(avalon.Array).to.have.all.keys(['merge', 'ensure', 'remove', 'removeAt'])

        })
    })

  

})