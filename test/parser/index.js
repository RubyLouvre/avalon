import { createGetter, createSetter} from  
'../../src/parser/index'

describe('parser', function () {
    it('test', function () {
        var a = createGetter("ssss throw eee ")
        expect(a).toBe(avalon.noop)
         var b = createSetter("ssss throw eee ")
        expect(b).toBe(avalon.noop)
    })
})