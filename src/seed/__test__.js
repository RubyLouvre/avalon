
var file = process.env.modern === true ? 'modern' : 'compact'

var avalon = require("./" + file)
var isArrayLike = require('./lang.' + file).isArrayLike
var share = require('./lang.share')
var expect = require('chai').expect

describe('测试core文件的API', function () {

    describe('init', function () {
        it('test', function () {
            expect(avalon.init).to.be.a('function')
        })
    })

    describe('fn', function () {
        it('test', function () {
            expect(avalon.fn).to.equal(avalon.prototype)
        })
    })

    describe('shadowCopy', function () {
        it('test', function () {
            var obj = {}
            avalon.mix(obj, {
                a: 1,
                b: 2
            })
            expect(obj).to.eql({a: 1, b: 2})
        })
    })

    describe('noop', function () {
        it('test', function () {
            expect(avalon.noop).to.be.a('function')
        })
    })
    describe('rword', function () {
        it('test', function () {
            expect(avalon.rword).to.be.a('regexp')
        })
    })

    describe('inspect', function () {
        it('test', function () {
            var a = avalon.inspect
            expect(a).to.equal(Object.prototype.toString)

            expect(a.call('')).to.equal('[object String]')
            expect(a.call([])).to.equal('[object Array]')
            expect(a.call(1)).to.equal('[object Number]')
            expect(a.call(new Date())).to.equal('[object Date]')
            expect(a.call(/test/)).to.equal('[object RegExp]')
        })
    })

    describe('ohasOwn', function () {
        it('test', function () {
            expect(avalon.ohasOwn).to.equal(Object.prototype.hasOwnProperty)
        })
    })

    describe('log', function () {
        it('test', function () {
            expect(avalon.log).to.be.a('function')
        })
    })
    describe('warn', function () {
        it('test', function () {
            expect(avalon.warn).to.be.a('function')
        })
    })
    describe('error', function () {
        it('test', function () {
            expect(avalon.error).to.be.a('function')
        })
    })

    describe('oneObject', function () {
        it('test', function () {
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

})

describe('测试browser文件的API', function () {

    describe('document', function () {
        it('test', function () {
            expect(avalon.document).to.be.a('object')
        })
    })

    describe('window', function () {
        it('test', function () {
            expect(avalon).have.property('window')
        })
    })

    describe('root', function () {
        it('test', function () {
            expect(avalon).to.have.property('root')
        })
    })

    describe('avalonDiv', function () {
        it('test', function () {
            expect(avalon).to.have.property('avalonDiv')
        })
    })

    describe('avalonFragment', function () {
        it('test', function () {
            expect(avalon).to.have.property('avalonFragment')
        })
    })

    describe('msie', function () {
        it('test', function () {
            expect(avalon.msie).to.be.a('number')
        })
    })

    describe('modern', function () {
        it('test', function () {
            expect(avalon.modern).to.be.a('boolean')
        })
    })


})

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

    describe('isArrayLike', function () {
        it('test', function () {
            expect(avalon.isArrayLike).to.be.a('undefined')
            expect(isArrayLike).to.be.a('function')
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
    describe('resolvedComponents', function () {
        it('test', function () {
            expect(avalon.resolvedComponents).to.be.a('object')
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

    describe('getLongID', function () {
        it('test', function () {
            var obj = {}
            share.getLongID(obj)
            expect(obj.uuid).to.match(/e\d{8,11}/)
        })
    })

    describe('getShortID', function () {
        it('test', function () {
            var obj = {}
            share.getShortID(obj)
            expect(obj.uuid).to.match(/_\d{1,2}/)
        })
    })

})

describe('测试config文件的API', function () {
    describe('config', function () {
        it('test', function () {
            expect(avalon.config).to.be.a('function')
            expect(avalon.config).to.have.all.keys(
                    [
                        'openTag', 'closeTag', 'rbind', 'rexpr', 'rexprg', 'plugins', 'debug'
                    ])
            expect(avalon.config.openTag).to.equal('{{')
            expect(avalon.config.closeTag).to.equal('}}')
            expect(avalon.config.plugins.interpolate).to.be.a('function')
        })
    })
})

describe('测试cache文件的API', function () {
    describe('LRU', function () {
        var Cache = require('./cache')
        var cache = new Cache(125)
        it('test', function () {

            expect(cache.get).to.be.a('function')
            expect(cache.put).to.be.a('function')
            expect(cache.shift).to.be.a('function')

        })
    })
})