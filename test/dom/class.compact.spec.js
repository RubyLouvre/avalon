import { avalon } from '../../src/seed/core'
import { ClassList, classListFactory } from '../../src/dom/class/compact'

describe('class', function () {
    it('ClassList', function () {
        var node = {
            setAttribute: function (name, cls) {
                this.className = {
                    baseVal: cls
                }
            },
            className: {
                baseVal: ''
            }
        }
        var ss = classListFactory(node)
        expect(ss).toInstanceOf(ClassList)
        ss.add('aaa')
        ss.add('bbb')

        expect(ss + "").toBe('aaa bbb')
        expect(ss.contains('bbb')).toBe(true)
        ss.remove('bbb')
        ss.add('er')
        expect(ss + '').toBe('aaa er')
        //=========
        node.className = ""
        node.setAttribute = function (_, cls) {
            node.className = cls   
        }
        //=======
        ss.add('last')
        //jasmine
        expect(ss.node.className).toBe('last')
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
