var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
describe('数据模型', function () {

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
        it('没有id的vm会自动加上ID', function () {
            vm = avalon.define({
            })
            var id = vm.$id
            expect(typeof id).to.equal('string')
            delete avalon.vmodels[id]
        })
        it('ID重复会报错', function () {
            vm = avalon.define({
                $id: 'repeat111'
            })
            try {
                avalon.define({
                    $id: 'repeat111'
                })
            } catch (e) {
                expect(/had\sdefined!/.test(e.message)).to.equal(true)
            }
            delete avalon.vmodels[vm.id]
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

    describe('监控数组', function () {
        it('数组方法', function (done) {
            var vm = avalon.define({
                $id: 'arr1',
                arr: [1, 2]
            })
            vm.arr.push(3)
            expect(vm.arr.length).to.equal(3)
            vm.arr.unshift(3)
            expect(vm.arr.length).to.equal(4)
            expect(vm.arr.$model).to.eql([3, 1, 2, 3])
            vm.arr.set(1, 7)
            expect(vm.arr[1]).to.equal(7)
            vm.arr.ensure(8)
            expect(vm.arr.$model).to.eql([3, 7, 2, 3, 8])
            vm.arr.ensure(2)
            expect(vm.arr.$model).to.eql([3, 7, 2, 3, 8])
            vm.arr.removeAll(function (a) {
                return a === 3
            })
            expect(vm.arr.$model).to.eql([7, 2, 8])
            vm.arr.pushArray([1, 2, 3])
            expect(vm.arr.$model).to.eql([7, 2, 8, 1, 2, 3])
            vm.arr.removeAt(2)
            expect(vm.arr.$model).to.eql([7, 2, 1, 2, 3])
            vm.arr.remove(7)
            expect(vm.arr.$model).to.eql([2, 1, 2, 3])
            var callback = sinon.spy()
            vm.$watch('arr.length', callback)
            vm.arr.clear()
            expect(vm.arr.$model).to.eql([])
            expect(callback.called).to.equal(true)
            setTimeout(function () {
                delete avalon.vmodels.arr1
                done()
            }, 300)

        })

    })
    describe('vm的方法与属性', function () {
        it('vm的方法与属性[ ' + avalon.version + ' ]', function () {
            var vm = avalon.define({
                $id: "a1111",
                a: 111,
                b: true
            })

            expect(vm.$id).to.equal("a1111")
            expect(avalon.vmodels.a1111).to.equal(vm)
            if (!avalon.modern) {
                expect(vm.$accessors.a).to.be.a("object")
            } else {
                var descriptor = Object.getOwnPropertyDescriptor(vm, "a")
                expect(descriptor).to.be.a("object")
                expect(descriptor.get).to.be.a("function")
                expect(descriptor.set).to.be.a("function")
            }
            expect(/\$\d+/.test(vm.$hashcode)).to.be.ok
            expect(vm.$watch).to.be.a("function")
            expect(vm.$fire).to.be.a("function")
            expect(vm.$events).to.be.a("object")
            expect(vm.$model).to.eql({
                a: 111,
                b: true
            })
            expect(vm.hasOwnProperty("a")).to.be.ok
            expect(vm.hasOwnProperty("$id")).to.not.be.ok
            if (Object.getOwnPropertyDescriptor) {
                expect(vm.$model).to.have.all.keys('a', 'b')
            }
            delete avalon.vmodels.a1111
            vm.$hashcode = false
        })
    })
})