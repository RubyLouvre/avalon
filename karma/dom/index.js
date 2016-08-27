
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
            expect(avalon.parseHTML('xxx').nodeType).to.equal(3)
            expect(avalon.parseHTML(null).nodeType).to.equal(11)
            expect(avalon.parseHTML('<div></div>').nodeType).to.equal(11)
            expect(avalon.parseHTML('<div></div>').nodeType).to.equal(11)

            var table = document.createElement('table')
            avalon.innerHTML(table, '<tr><td>111</td></tr>')
            expect(table.getElementsByTagName('td').length).to.equal(1)
            avalon.clearHTML(table)
            expect(table.childNodes.length).to.equal(0)

            expect(avalon.parseHTML).to.be.a('function')
            expect(avalon.innerHTML).to.be.a('function')
            expect(avalon.clearHTML).to.be.a('function')
        })
        describe('unescapseHTML', function () {
            var fn = avalon.unescapeHTML
            it('converts &amp; into &', function () {
                expect(fn('&amp;')).to.be.equal('&')
            })
            it('converts &lt; into <', function () {
                expect(fn('&lt;')).to.be.equal('<')
            })
            it('converts &gt; into >', function () {
                expect(fn('&gt;')).to.be.equal('>')
            })
            it('converts &#39; into \'', function () {
                expect(fn('&#39;')).to.be.equal('\'')
            })
            it('converts &quot; into "', function () {
                expect(fn('&quot;')).to.be.equal('"')
            })
            it('it is the reverse of escape-html', function () {
                var str1 = '<strong> & <a> are examples of "HTML Tags"'
                var str2 = '&amp; & &gt; are examples of \'HTML entities\''
                expect(fn(avalon.filters.escape(str1) + "!!")).to.be.equal(str1 + "!!")

                expect(fn(avalon.filters.escape(str2))).to.be.equal(str2)
            })
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