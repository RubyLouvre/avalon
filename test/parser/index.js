import { createGetter, createSetter, addScope} from  
'../../src/parser/index'

describe('parser', function () {
    it('test', function () {
        var a = createGetter("ssss throw eee ")
        expect(a).toBe(avalon.noop)
        var b = createSetter("ssss throw eee ")
        expect(b).toBe(avalon.noop)
    })
    
     it('处理正则', function () {
        var arr = addScope("{required:true,pattern:/[\u4e00-\u9fa5a-z]{2-8}/i}")
        expect(arr[0]).toBe('{required :true,pattern :/[\u4e00-\u9fa5a-z]{2-8}/i }')
       
    })
     it('处理数组', function () {
        var arr = addScope("[{is:'ms-address-wrap', $id:'address'}]")
        expect(arr[0]).toBe("[{is :'ms-address-wrap' ,$id :'address' }]")
       
    })
    
})