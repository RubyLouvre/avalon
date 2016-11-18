import { avalon } from '../../src/seed/core'
import { avEvent } from '../../src/dom/event/modern'
import '../../src/dom/ready/modern'

describe('event', function () {
    it('getAttribute', function () {
        var div2 = document.createElement('div')
        div2.setAttribute("aaa", 'ddd')

        expect(div2.getAttribute('aaa')).toBe('ddd')
    })
    it('avEvent', function () {
        var event = {
            srcElement: {
                ownerDocument: {
                    documentElement: {},
                    body: {}
                }
            },
            type: 'click',
            keyCode: 12,
            clientX: 11,
            clientY: 118,
            wheelDelta: 0
        }
        var e = new avEvent(event)

        expect(e.target).toBe(event.srcElement)
        expect(e.originalEvent).toBe(event)
        expect(e.type).toBe('click')
        if(!avalon.modern){
            expect(e.pageX).toBe(11)
            expect(e.pageY).toBe(118)
            expect(e.wheelDelta).toBe(0)
        }
        expect(e.preventDefault).toA('function')
        expect(e.stopPropagation).toA('function')
        expect(e.stopImmediatePropagation).toA('function')
        e.preventDefault()
        expect(e.returnValue).toBe(false)
        e.stopPropagation()
        expect(e.cancelBubble).toBe(true)
        e.cancelBubble = 2
        e.stopImmediatePropagation()
        expect(e.cancelBubble).toBe(true)
        expect(e.stopImmediate).toBe(true)
        expect(e + "").toMatch(/object\s+Event/)
        var e2 = new avEvent(e)
        expect(e2).toBe(e)

    })
    it('bind', function () {
        var div = document.createElement('div')
        document.body.appendChild(div)
        var changed = false
        avalon(div).bind('click', function () {
            changed = true
            return false
        })
        avalon.fireDom(div, 'click')
        fireClick(div)
        expect(changed).toBe(true)
        avalon(div).unbind('click')

    })


})
