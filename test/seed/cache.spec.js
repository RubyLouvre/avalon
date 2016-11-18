import  {Cache}  from '../../src/seed/core'

describe('测试cache文件的API', function () {

    describe('Cache', function () {
        var cache = new Cache(3)
        it('test', function () {

            expect(cache.get).toA('function')
            expect(cache.put).toA('function')
            expect(cache.shift).toA('function')
            var e = cache.put('aa', 'bb')
            expect(e).toBe('bb')
            expect(cache.limit).toBe(3)
            expect(cache.size).toBe(1)
            cache.put('eee', 'bb')
            cache.put('ddd', '111')
            cache.get('aa')
            cache.put('fff', '111')
            cache.get('aa')
            cache.put('999', '111')
            expect(cache.size).toBe(3)
            expect(cache.get('eee')).toBe(void 0)
        })
    })
})
