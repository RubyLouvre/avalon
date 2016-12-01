import { avalon } from '../../src/seed/core'
import { updateAttrs } from '../../src/dom/attr/compact'
import { compactParseJSON } from '../../src/dom/attr/parseJSON.compact'

import { isVML } from '../../src/dom/attr/isVML'

describe('attr', function() {
    describe('batchUpdateAttrs', function() {
        var props = {
            src: 'https://github.com/ecomfe/zrender',
            href: 'https://github.com/ecomfe/zrender',
            'data-title': "aaa",
            'for': 'bbb',
            'aaa': false,
            'class': 'eee',
            readonly: true
        }

        it('为label添加各种属性', function() {

            var label = document.createElement('label')
            label.setAttribute('bbb', '111')
            try {
                updateAttrs(label, props)
            } catch (e) {
                console.log('ddd', e)
            }
            if (avalon.modern) {
                expect(label.getAttribute('src')).toBe('https://github.com/ecomfe/zrender')
                expect(label.getAttribute('href')).toBe('https://github.com/ecomfe/zrender')
                expect(label.getAttribute('aaa')).toBe(null)
                expect(label.getAttribute('data-title')).toBe('aaa')
                expect(label.getAttribute('for')).toBe('bbb')
            }
            expect(label.className).toBe('eee')

            avalon(label).attr("title", '222')
            expect(avalon(label).attr('title')).toBe('222')
        })

        it('为option添加各种属性', function() {
            var option = document.createElement('option')
            option.setAttribute('bbb', '111')
            updateAttrs(option, props)
            if (avalon.modern) {
                expect(option.getAttribute('src')).toBe('https://github.com/ecomfe/zrender')
                expect(option.getAttribute('href')).toBe('https://github.com/ecomfe/zrender')
                expect(option.getAttribute('aaa')).toBe(null)
                expect(option.getAttribute('data-title')).toBe('aaa')
                expect(option.getAttribute('for')).toBe('bbb')
            }
            expect(option.className).toBe('eee')
            avalon(option).attr("title", '222')
            expect(avalon(option).attr('title')).toBe('222')
        })
        it('为input添加各种属性', function() {
            var option = document.createElement('input')
            option.setAttribute('aaa', '111')

            updateAttrs(option, props)
            if (avalon.modern) {
                expect(option.getAttribute('src')).toBe('https://github.com/ecomfe/zrender')
                expect(option.getAttribute('href')).toBe('https://github.com/ecomfe/zrender')
                expect(option.getAttribute('aaa')).toBe(null)
                expect(option.getAttribute('data-title')).toBe('aaa')
                expect(option.getAttribute('for')).toBe('bbb')
            }
            expect(option.className).toBe('eee')
            avalon(option).attr("title", '222')
            expect(avalon(option).attr('title')).toBe('222')
        })
        it('为textarea添加各种属性', function() {
            var option = document.createElement('textarea')
            option.setAttribute('aaa', '111')
            updateAttrs(option, props)
            if (avalon.modern) {
                expect(option.getAttribute('src')).toBe('https://github.com/ecomfe/zrender')
                expect(option.getAttribute('href')).toBe('https://github.com/ecomfe/zrender')
                expect(option.getAttribute('aaa')).toBe(null)
                expect(option.getAttribute('data-title')).toBe('aaa')
                expect(option.getAttribute('for')).toBe('bbb')
            }
            expect(option.className).toBe('eee')
            avalon(option).attr("title", '222')
            expect(avalon(option).attr('title')).toBe('222')
        })
        it('为span添加各种属性', function() {
            var option = document.createElement('span')
            option.getAttribute('aaa', '111')
            updateAttrs(option, props)
            if (avalon.modern) {
                expect(option.getAttribute('src')).toBe('https://github.com/ecomfe/zrender')
                expect(option.getAttribute('href')).toBe('https://github.com/ecomfe/zrender')
                expect(option.getAttribute('aaa')).toBe(null)
                expect(option.getAttribute('data-title')).toBe('aaa')
                expect(option.getAttribute('for')).toBe('bbb')
            }
            expect(option.className).toBe('eee')
            avalon(option).attr("title", '222')
            expect(avalon(option).attr('title')).toBe('222')
        })
    })
    describe('IE67的模拟', function() {
        it('test', function() {
            var a = document.createElement('a')
            var pre = avalon.msie
            avalon.msie = 7
            updateAttrs(a, {
                'for': 'xxx',
                'class': 'xxx',
                'href': 'aaa&amp;bbb'

            })
            expect(a.htmlFor).toBe('xxx')
            expect(a.className).toBe('xxx')
            expect(a.href).toMatch(/aaa&bbb/)
            avalon.msie = pre
        })
    })
    describe('compactParseJSON', function() {
        it('test', function() {
            expect(compactParseJSON()).toBe(void 0)
            expect(compactParseJSON(null)).toBe(null)

            expect(compactParseJSON("{}")).toEqual({})
            expect(compactParseJSON("{\"test\":1}")).toEqual({ test: 1 })
            expect(compactParseJSON("\n{\"test\":1}")).toEqual({ test: 1 })

            expect(function() {
                compactParseJSON("");
            }).toThrowError(TypeError)

            expect(function() {
                compactParseJSON("{a:1}");
            }).toThrowError(TypeError)

            expect(function() {
                compactParseJSON("{'a':1}");
            }).toThrowError(TypeError)


        })
    })

    describe('isVML', function() {
        it('test', function() {
            if (avalon.msie < 9) {
                document.namespaces.add("v", "urn:schemas-microsoft-com:vml", "#default#VML");
                var oval = document.createElement("v:oval")
                expect(isVML(oval)).toBe(true)
            } else {
                var oval = document.createElement("v:oval")
                expect(isVML(oval)).toBe(false)
            }

        })
    })
})