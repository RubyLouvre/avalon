import { avalon, inspect, ohasOwn, getLongID, getShortID } from
    '../../src/seed/core'
describe('seed/core', function () {

    // jasmine.addMatchers
    it('avalon', function () {
        expect(avalon).toA('function')
        var a = {}
        expect(avalon(a)[0]).toBe(a)
        expect(avalon(a).element).toBe(a)
        console.log(avalon.msie, '当前游览器是')
    })
    it('config', function () {

        try {
            avalon.config({ interpolate: ['aaa', 'aaa'] })
        } catch (e) {
            expect(e).toA('error')
        }
        try {
            avalon.config({ interpolate: ['<<', '>>'] })
        } catch (e) {
            expect(e).toA('error')
        }
        try {
            avalon.config({ interpolate: ['aaa', '>>'] })
        } catch (e) {
            expect(e).toA('error')
        }
        avalon.config({ aaa: 1 })
        avalon.config({ interpolate: ['{{', '}}'] })
        expect(avalon.config.aaa).toBe(1)
        delete avalon.config.aaa
    })

    it('shadowCopy', function () {
        var a = { aa: 1 }
        var b = { bb: 2 }
        var c = avalon.shadowCopy(a, b)
        expect(c).toBe(a)
        expect(c).toEqual({ aa: 1, bb: 2 })
        expect(avalon.shadowCopy).toBeTruthy()
    })

    it('inspect', function () {
        expect(inspect).toBe(Object.prototype.toString)
        expect(inspect.call('')).toBe('[object String]')
        expect(inspect.call([])).toBe('[object Array]')
        expect(inspect.call(1)).toBe('[object Number]')
        expect(inspect.call(new Date())).toBe('[object Date]')
        expect(inspect.call(/test/)).toBe('[object RegExp]')
    })
   it('parsers', function () {
        
            expect(avalon.parsers).toA('object')
            expect(avalon.parsers.number('111')).toBe(111)
            expect(avalon.parsers.number('')).toBe('')
            expect(avalon.parsers.number('ddd')).toBe(0)
            expect(avalon.parsers.string(111)).toBe('111')
            expect(avalon.parsers.string(null)).toBe('')
            expect(avalon.parsers.string(void 0)).toBe('')
            expect(avalon.parsers.boolean('')).toBe('')
            expect(avalon.parsers.boolean('true')).toBe(true)
            expect(avalon.parsers.boolean('1')).toBe(true)

        
    })
    it('ohasOwn', function () {
        expect(ohasOwn).toA('function')
        expect(ohasOwn).toBe(Object.prototype.hasOwnProperty)
    })

    it('noop', function () {
         expect(avalon.noop).not.toThrow();
         expect(avalon.noop()).toBeUndefined()
    })

    it('log', function () {
        expect(avalon.log(11, 22)).toBeUndefined()
        expect(avalon.log).toA('function')
        spyOn(avalon, 'log')
        avalon.log(33)
        expect(avalon.log).toHaveBeenCalled()

    })
    it('warn', function () {
        expect(avalon.warn(11, 22)).toBeUndefined()
        expect(avalon.warn).toA('function')
    })

    it('error', function () {
        expect(function () {
            avalon.error('aaa')

        }).toThrowError(TypeError)

        expect(function fn2() {
            avalon.error('eee', TypeError)
        }).toThrowError(TypeError)

    })
    it('_decode', function () {
        expect(/^\s+$/.test(avalon._decode('&nbsp;'))).toBe(true)
        expect(avalon._decode('aaa')).toBe('aaa')
    })

    it('oneObject', function () {

        expect(avalon.oneObject('aa,bb,cc')).toEqual({
            aa: 1,
            bb: 1,
            cc: 1
        })
        expect(avalon.oneObject('')).toEqual({})
        expect(avalon.oneObject([1, 2, 3], false)).toEqual({
            1: false,
            2: false,
            3: false
        })
    })

    it('hyphen', function () {

        expect(typeof avalon.hyphen).toBe('function')
        expect(avalon.hyphen("aaaBBB")).toBe('aaa-bbb')

    })

    it('camelize', function () {

        expect(typeof avalon.camelize).toBe('function')
        expect(avalon.camelize('aaa-bbb-ccc')).toBe('aaaBbbCcc')
        expect(avalon.camelize('aaa_bbb_ccc')).toBe('aaaBbbCcc')
        expect(avalon.camelize('')).toBe('')
    })

    it('makeHashCode', function () {

        expect(typeof avalon.makeHashCode).toBe('function')
        expect(avalon.makeHashCode('eee')).toMatch(/eee\d+/)

    })

    it('getLongID', function () {

        expect(getLongID({})).toMatch(/e\d{6,}/)

    })

    it('getShortID', function () {

        expect(getShortID({})).toMatch(/_\d{1,3}/)

    })

    it('escapeRegExp', function () {

        var str = '\\ ^ $ * + ? . ( ) | { } [ ]'
        expect(avalon.escapeRegExp(str)).toBe('\\\\ \\^ \\$ \\* \\+ \\? \\. \\( \\) \\| \\{ \\} \\[ \\]')

    })

    it('slice', function () {

        expect(avalon.slice([1, 2, 3, 4], 1, 2)).toEqual([2])

    })
    it('isObject', function () {

        expect(avalon.isObject({})).toBe(true)
        expect(avalon.isObject(avalon.noop)).toBe(false)

    })

    it('range', function () {

        expect(avalon.range(10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        expect(avalon.range(1, 11)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        expect(avalon.range(0, 30, 5)).toEqual([0, 5, 10, 15, 20, 25])
        expect(avalon.range(0, -10, -1)).toEqual([0, -1, -2, -3, -4, -5, -6, -7, -8, -9])
        expect(avalon.range(0)).toEqual([])


    })


    it('avalon.Array', function () {

        expect(avalon.Array).toA('object')
        expect(avalon.Array).toHaveKeys(['merge', 'ensure', 'remove', 'removeAt'])
        var aaa = [11, 22]
        avalon.Array.merge(aaa, [33, 44])
        expect(aaa).toEqual([11, 22, 33, 44])
        var e1 = avalon.Array.ensure(aaa, 11)
        expect(e1).toEqual(void 0)
        expect(aaa).toEqual([11, 22, 33, 44])
        var e2 = avalon.Array.ensure(aaa, 55)
        expect(e2).toEqual(5)
        expect(aaa).toEqual([11, 22, 33, 44, 55])
        avalon.Array.remove(aaa, 33)
        expect(aaa).toEqual([11, 22, 44, 55])
        avalon.Array.remove(aaa, 77)
        avalon.Array.removeAt(aaa, 2)
        expect(aaa).toEqual([11, 22, 55])

    })

})