

var file = process.env.modern === true ? 'modern' : 'compact'

var avalon = require("./" + file)

var expect = require('chai').expect

describe('测试dom模块', function () {

    describe('shim', function () {
        it('contains', function () {
            expect(avalon.contains).to.be.a('function')
        })
    })
    
    describe('class', function () {
        
        it('addClass,removeClass,hasClass,toggleClass', function () {
            expect(avalon.fn.addClass).to.be.a('function')
            expect(avalon.fn.removeClass).to.be.a('function')
            expect(avalon.fn.hasClass).to.be.a('function')
            expect(avalon.fn.toggleClass).to.be.a('function')
        })

    })
    describe('data', function () {
        it('test', function () {
            expect(avalon.fn.attr).to.be.a('function')
        })
    })
    describe('css', function () {
        it('test', function () {
            expect(avalon.cssHooks).to.be.a('object')
            expect(avalon.cssNumber).to.be.a('object')
            expect(avalon.cssName).to.be.a('function')
            expect(avalon.fn.css).to.be.a('function')

            expect(avalon.fn.position).to.be.a('function')
            expect(avalon.fn.offsetParent).to.be.a('function')

            expect(avalon.fn.width).to.be.a('function')
            expect(avalon.fn.height).to.be.a('function')

            expect(avalon.fn.innerWidth).to.be.a('function')
            expect(avalon.fn.innerHeight).to.be.a('function')
            expect(avalon.fn.outerWidth).to.be.a('function')
            expect(avalon.fn.outerHeight).to.be.a('function')
            expect(avalon.fn.offset).to.be.a('function')
            expect(avalon.fn.scrollLeft).to.be.a('function')
            expect(avalon.fn.scrollTop).to.be.a('function')


        })
    })
    describe('val', function () {
        it('test', function () {
            expect(avalon.fn.val).to.be.a('function')
        })
    })
    describe('html', function () {
        it('test', function () {
            expect(avalon.parseHTML).to.be.a('function')
            expect(avalon.innerHTML).to.be.a('function')
            expect(avalon.clearHTML).to.be.a('function')
        })
    })
    describe('event', function () {
        it('test', function () {
            expect(avalon.fn.bind).to.be.a('function')
            expect(avalon.fn.unbind).to.be.a('function')
        })
    })
    describe('ready', function () {
        it('test', function () {
            expect(avalon.ready).to.be.a('function')
        })
    })
})