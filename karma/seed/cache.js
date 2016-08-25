describe('测试cache文件的API', function () {
    describe('LRU', function () {
        var Cache = avalon.cache
        var cache = new Cache(3)
        it('test', function () {

            expect(cache.get).to.be.a('function')
            expect(cache.put).to.be.a('function')
            expect(cache.shift).to.be.a('function')
            var e = cache.put('aa', 'bb')
            expect(e).to.equal('bb')
            expect(cache.limit).to.equal(3)
            expect(cache.size).to.equal(1)
            cache.put('eee', 'bb')
            cache.put('ddd', '111')
            cache.get('aa')
            cache.put('fff', '111')
            cache.get('aa')
            cache.put('999', '111')
            expect(cache.size).to.equal(3)
            expect(cache.get('eee')).to.equal(void 0)
        })
    })
})