import { avalon } from '../../src/dom/html/index'

describe('html', function () {
    var unescape = avalon.unescapeHTML
    describe('unescapeHTML', function () {
        it('converts &amp; into &', function () {
            expect(unescape('&amp;')).toBe('&')
        });

        it('converts &quot; into "', function () {
            expect(unescape('&quot;')).toBe('"')
        });

        it('converts &#39; into \'', function () {
            expect(unescape('&#39;')).toBe('\'')
        });

        it('converts &lt; into <', function () {
            expect(unescape('&lt;')).toBe('<')
        });

        it('converts &gt; into >', function () {
            expect(unescape('&gt;')).toBe('>')
        });
    })
    describe('clearHTML', function () {
        it('test', function () {
            var div = document.createElement('div')
            div.innerHTML = "<p>ddd</p><b>333</b>"
            avalon.clearHTML(div)
            expect(div.childNodes.length).toBe(0)
        });

    })
    describe('clearHTML', function () {
        var oldLexer
        beforeEach(function () {
            oldLexer = avalon.lexer
            avalon.lexer = function () {
                return [{
                    nodeName: 'div',
                    props: {},
                    children: [{
                        nodeName: '#text',
                        nodeValue: '222'
                    }]
                }, {
                    nodeName: 'div',
                    props: {},
                    children: [{
                        nodeName: '#text',
                        nodeValue: '222'
                    }]
                }]
            }
        })
        afterEach(function(){
            avalon.lexer = oldLexer
        })
        it('avalon.parseHTML && innerHTML', function () {
            var a = avalon.parseHTML(null)
            expect(a.nodeType).toBe(11)
            var b = avalon.parseHTML('111')
            expect(b.nodeType).toBe(3)
        })
        it("parseHTL2", function(){
            var c = avalon.parseHTML('<div>222</div><div>222</div>')
            expect(c.nodeType).toBe(11)
            expect(c.childNodes.length).toBe(2)
        })
        it('parseHTML3', function(){
            var div = document.createElement('div')
            div.innerHTML = "<p>ddd</p><b>333</b>"
            avalon.innerHTML(div, '<div>222</div><div>222</div>')
            expect(div.getElementsByTagName('div').length).toBe(2)
        })

    })


})
