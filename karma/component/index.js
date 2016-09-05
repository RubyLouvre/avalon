
describe('测试component模块', function () {

    describe('onComponentDispose', function () {
        it('contains', function () {
            var fn = avalon._disposeComponent
            expect(fn).to.be.a('function')
            var div = document.createElement('div')
            fn.byMutationEvent(div)
            fn.byRewritePrototype(div)
            fn.byPolling(div)
            expect(fn.byRewritePrototype.execute).to.be.a('boolean')

        })
    })

})
