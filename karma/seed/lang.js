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
            expect(avalon.parsers).to.be.a('object')
            expect(avalon.parsers.number('111')).to.be.equal(111)
            expect(avalon.parsers.number('')).to.be.equal('')
            expect(avalon.parsers.number('ddd')).to.be.equal(0)
            expect(avalon.parsers.string(111)).to.be.equal('111')
            expect(avalon.parsers.string(null)).to.be.equal('')
            expect(avalon.parsers.string(void 0)).to.be.equal('')
            expect(avalon.parsers.boolean('')).to.be.equal('')
            expect(avalon.parsers.boolean('true')).to.be.equal(true)
            expect(avalon.parsers.boolean('1')).to.be.equal(true)

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
            avalon.css({}, 'float', 'left')
            var body = document.body
            avalon.css(body, 'float', 'left')

            expect(avalon.css(avalon(body), 'float')).to.be.equal('left')
            avalon.css(body, 'width', 800)
            expect(avalon.css(body, 'width')).to.be.equal(800)
            avalon.css(body, 'width', NaN)
            expect(avalon.css(body, 'width')).to.be.equal(800)
            expect(avalon.css(body, 'width', true)).to.be.equal(800)
            avalon.css(body, 'width', '')
            expect(avalon.css(body, 'background')).to.be.match(/white|rgba?\(0,\s*0,\s*0,?\s*0?\)/)
            expect(avalon(body).position()).to.be.eql({
                top: 0,
                left: 0
            })


        })
    })
    describe('directive', function () {
        it('test', function () {
            expect(avalon.directive).to.be.a('function')
            avalon.directive("sss", {})
            expect(avalon.directives.sss).to.be.a('object')
            delete avalon.directives.sss
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
            expect(avalon.range(10)).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
            expect(avalon.range(1, 11)).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
            expect(avalon.range(0, 30, 5)).to.eql([0, 5, 10, 15, 20, 25])
            expect(avalon.range(0, -10, -1)).to.eql([0, -1, -2, -3, -4, -5, -6, -7, -8, -9])
            expect(avalon.range(0)).to.eql([])

        })
    })

    describe('hyphen', function () {
        it('test', function () {
            expect(avalon.hyphen).to.be.a('function')
            expect(avalon.hyphen("aaaBBB")).to.be.equal('aaa-bbb')
        })
    })

    describe('camelize', function () {
        it('test', function () {
            expect(avalon.camelize).to.be.a('function')
            expect(avalon.camelize('aaa')).to.be.equal('aaa')
        })
    })

    describe('makeHashCode', function () {
        it('test', function () {
            expect(avalon.makeHashCode).to.be.a('function')
            expect(avalon.makeHashCode('eee')).to.be.a('string')

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
            var aaa = [11, 22]
            avalon.Array.merge(aaa, [33, 44])
            expect(aaa).to.be.eql([11, 22, 33, 44])
            var e1 = avalon.Array.ensure(aaa, 11)
            expect(e1).to.be.equal(void 0)
            expect(aaa).to.be.eql([11, 22, 33, 44])
            var e2 = avalon.Array.ensure(aaa, 55)
            expect(e2).to.be.equal(5)
            expect(aaa).to.be.eql([11, 22, 33, 44, 55])
            avalon.Array.remove(aaa, 33)
            expect(aaa).to.be.eql([11, 22, 44, 55])
            avalon.Array.remove(aaa, 77)
            avalon.Array.removeAt(aaa, 2)
            expect(aaa).to.be.eql([11, 22, 55])

        })
    })

})


