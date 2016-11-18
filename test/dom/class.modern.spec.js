import { avalon } from '../../src/seed/core'
import '../../src/dom/class/modern'

describe('class', function () {
    it('classList', function () {
    
        if (avalon.modern) {
            var textPath = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
            expect(typeof textPath).toBe('object')
            avalon(textPath).addClass('aaa bbb ccc')
            expect(textPath.getAttribute('class')).toBe('aaa bbb ccc')
            avalon(textPath).removeClass('aaa ccc')
            expect(textPath.getAttribute('class')).toBe('bbb')
        }
        var div = document.createElement("div");

        avalon(div).addClass('aaa bbb ccc')
        expect(div.className).toBe('aaa bbb ccc')
        avalon(div).removeClass('aaa ccc')
        expect(div.className).toBe('bbb')
        avalon(div).toggleClass('eee')
        expect(div.className).toBe('bbb eee')
        avalon(div).toggleClass('eee')
        expect(div.className).toBe('bbb')
        avalon(div).toggleClass('bbb', false)
        expect(div.className).toBe('')
        avalon(div).toggleClass('ccc fff', true)
        expect(div.className).toBe('ccc fff')
    })

})
