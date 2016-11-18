import { dig, clearString, fill, rfill } from '../../src/vtree/clearString'

describe('clearString', function() {

    it('test', function() {
        var a = "111+'ddd'+'eee'"
        var a2 = dig(a)
        expect(/'/.test(a2)).toBe(false)

        var b = '111+\n"ddd"+"eee"'
        var b2 = clearString(b)
        expect(/"/.test(b2)).toBe(false)

        var b3 = b.replace(rfill, fill)

        expect(/\?\?/.test(b3)).toBe(false)
    })
})