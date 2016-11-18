import { avalon } from
    '../../src/seed/core'
import { updateAttrs } from
    '../../src/dom/attr/modern'


describe('attr', function () {
    describe('batchUpdateAttrs', function () {
        var props = {
                src: 'https://github.com/ecomfe/zrender',
                href: 'https://github.com/ecomfe/zrender',
                'data-title': "aaa",
                'for': 'bbb',
                'aaa': false,
                'class': 'eee',
                readonly: true
            }
        
        it('为label添加各种属性', function () {

            var label = document.createElement('label')
            label.setAttribute('bbb', '111')
            try{
            updateAttrs(label, props)
            }catch(e){
                console.log('ddd',e)
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

        it('为option添加各种属性', function () {
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
        it('为input添加各种属性', function () {
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
        it('为textarea添加各种属性', function () {
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
        it('为span添加各种属性', function () {
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

    
})


