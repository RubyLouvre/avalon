var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
describe('$watch', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('监听数组元素的属性变动', function (done) {

        vm = avalon.define({
            $id: 'watch1',
            arr: [{a: 1}, {a: 2}]
        })
        var index = 100
        vm.$watch('arr.*.a', function (v) {
            expect(v).to.equal(99)
            index = 101
        })

        setTimeout(function () {
            vm.arr[0].a = 99
            expect(index).to.equal(101)
            done()

        }, 100)
    })
    it('子级对象的属性变动', function (done) {

        vm = avalon.define({
            $id: 'watch2',
            a: {
                b: {
                    c: 666
                },
                d: 888
            }
        })
        var index = 100
       vm.$watch('a.d', function (v) {
            expect(v).to.equal(99)
            index = 101
        })

        var unwatch1 = vm.$watch('a.*', function (v, d, k) {
            expect(k).to.equal('a.d')
        })
        var unwatch2 = vm.$watch('a.b.c', function (v) {
            expect(v).to.equal(99)
            index = 102
        })
        setTimeout(function () {
            vm.a.d = 99
            expect(index).to.equal(101)
            unwatch1()
            vm.a.b.c = 99
            setTimeout(function () {
                expect(index).to.equal(102)
                unwatch2()
                var unwatch3 = vm.$watch('a.b.c', function (vv) {
                    expect(vv).to.equal(999)
                    index = 103
                })
                vm.a.b = {
                    c: 888
                }
                vm.a.b.c = 999
                setTimeout(function () {
                    expect(index).to.equal(103)
                    done()
                })

            })


        }, 100)
    })
})