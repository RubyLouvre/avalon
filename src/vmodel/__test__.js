var expect = require('chai').expect
var adjustVm = require('./dispatch').adjustVm

function testCase(current, version) {
    var define = current.define

    describe('avalon.define[ ' + version + ' ]', function () {

        it('vm的方法与属性[ ' + version + ' ]', function () {
            var vm = define({
                $id: "a1111",
                a: 111,
                b: true
            })

            expect(vm.$id).to.equal("a1111")
            expect(avalon.vmodels.a1111).to.equal(vm)
            if (version === "compact") {
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
        it('$watch[ ' + version + " ]", function (done) {
            var vm = define({
                $id: "test",
                a: 111,
                obj: {
                    b: 222
                },
                obj2: {
                    b: 222
                },
                array: [1, 2, 3],
                list: [{a: 11}, {a: 22}, {b: 33}],
                third: [{a: [{b: 111}, {b: 222}]}]
            })
            vm.$watch("a", function (a, b, path) {
                expect(a).to.eql(222)
                expect(b).to.eql(111)
                expect(path).to.eql("a")
            })
            vm.$watch("third.*.a.*.b", function (a, b, path) {
                expect(a).to.eql(77)
                expect(b).to.eql(111)
                expect(path).to.eql("third.*.a.*.b")
            })
            vm.$watch("obj.b", function (a, b, path) {
                expect(a).to.eql(333)
                expect(b).to.eql(222)
                expect(path).to.eql("obj.b")
            })
            vm.$watch("obj2.b", function (a, b, path) {
                expect(a).to.eql(333)
                expect(b).to.eql(222)
                expect(path).to.eql("obj2.b")
            })

            vm.$watch("array.length", function (a, b, path) {
                expect(a).to.eql(4)
                expect(b).to.eql(3)
                expect(path).to.eql("array.length")
            })
            vm.$watch("array.*", function (a, b, path) {
                expect(a).to.eql(10)
                expect(b).to.eql(1)
                expect(path).to.eql("array.*")
            })
            vm.$watch("list.*.a", function (a, b, path) {
                expect(a).to.eql(12)
                expect(b).to.eql(11)
                expect(path).to.eql("list.*.a")
            })
            vm.a = 222
            vm.obj.b = 333
            vm.obj2 = {
                b: 333
            }
            vm.list[0].a = 12
            vm.third[0].a[0].b = 77
            vm.array.set(0, 10)
            vm.array.push(4)
            setTimeout(function () {
                done()
                delete avalon.vmodels.test
            }, 300);
        })
        it('subModel[ ' + version + ' ]', function () {
            var vm = define({
                $id: "test2",
                obj: {
                    a: 222,
                    aa: {
                        b: 55,
                        aaa: {
                            b: 111
                        }
                    }
                }
            })
            expect(vm.$id).to.eql("test2")
            expect(vm.obj.$id).to.eql("test2.obj")
            expect(vm.obj.$events).to.equal(undefined)
            expect(vm.obj.$fire).to.equal(undefined)
            expect(vm.obj.$watch).to.equal(undefined)
            expect(vm.obj.$model).to.eql({
                a: 222,
                aa: {
                    b: 55,
                    aaa: {
                        b: 111
                    }
                }
            })
            expect(vm.obj.aa.$id).to.eql("test2.obj.aa")
            expect(vm.obj.aa.$events).to.equal(undefined)
            expect(vm.obj.aa.aaa.$id).to.eql("test2.obj.aa.aaa")
            expect(vm.obj.aa.aaa.$events).to.equal(undefined)
            expect(vm.obj.aa.aaa.b).to.eql(111)
            var list = [44, 55, 66, 77, 88]
            vm.$watch("obj.aa.aaa.b", function (a) {
                expect(a).to.equal(list.shift())
            })
            vm.obj.aa.aaa.b = 44
            vm.obj.aa.aaa = {
                b: 55
            }
            vm.obj.aa = {
                aaa: {
                    b: 66
                }
            }
            var old = vm.obj
            vm.obj = {
                aa: {
                    aaa: {
                        b: 77
                    }
                }
            }
            if (version === "compact") {
                expect(old.$hashcode).to.eql(false)
            } else {
                //在modern版本中,子对象是沿用原来的对象
                expect(old.$hashcode).to.eql(vm.obj.$hashcode)
                expect(old).to.eql(vm.obj)
            }
            vm.obj.aa.aaa.b = 88

            vm.obj = {
                aa: 44,
                cc: 55,
                dd: 66
            }
            expect(vm.obj.$model).to.eql({
                aa: 44, cc: 55, dd: 66
            })

            expect(vm.obj).to.have.all.keys('aa', 'cc', 'dd')
            delete avalon.vmodels.test2
        })

    })
    describe('Collection[ ' + version + ' ]', function () {
        it('test', function () {
            var vm = define({
                $id: "test3",
                array: [{a: 1}, {a: 2}, {a: 3}]
            })
            expect(vm.array).to.be.a('array')
            var array = vm.array
            expect(array.shift).to.be.a('function')
            expect(array.unshift).to.be.a('function')
            expect(array.sort).to.be.a('function')
            expect(array.reverse).to.be.a('function')
            expect(array.pop).to.be.a('function')
            expect(array.push).to.be.a('function')
            expect(array.splice).to.be.a('function')
            expect(array.remove).to.be.a('function')
            expect(array.removeAll).to.be.a('function')
            expect(array.clear).to.be.a('function')
            expect(array.set).to.be.a('function')
            expect(array.contains).to.be.a('function')
            delete avalon.vmodels.test3

        })
    })
    describe('mediatorFactory[ ' + version + ' ]', function () {
        var mediatorFactory = current.mediatorFactory
        it('test', function () {
            var vm1 = avalon.define({
                $id: 'vm1',
                aa: 11
            })
            vm1.$watch("aa", function (a) {
                expect(this.$id).to.eql("vm1")
                expect(a).to.equal(1111)
            })
            var vm2 = avalon.define({
                $id: 'vm2',
                bb: 22
            })
            var vm3 = mediatorFactory(vm1, vm2)

            vm3.$watch("aa", function (a) {
                expect(this.$id).to.equal("vm1")
                expect(a).to.equal(1111)
            })
            vm3.$watch("bb", function (a) {
                expect(this.$id).to.equal("vm1")
                expect(a).to.equal(2222)
            })
            expect(vm3.$id).to.equal("vm1")
            expect(vm3.$events).to.be.a('object')

            expect(vm3.$model).to.equal(undefined)
            expect(vm3.$watch).to.be.a('function')
            expect(vm3.$fire).to.be.a('function')
            if (version === "compact") {
                var aa = vm3.$accessors.aa
                var bb = vm3.$accessors.bb
                expect(aa).to.be.a("object")
                expect(vm1.$accessors.aa).to.equal(aa)
                expect(vm2.$accessors.bb).to.equal(bb)
                expect(aa.get.heirloom).to.equal(vm1.$accessors.aa.get.heirloom)
                expect(bb.get.heirloom).to.equal(vm2.$accessors.bb.get.heirloom)

            } else {
                var aa = Object.getOwnPropertyDescriptor(vm3, "aa")
                var bb = Object.getOwnPropertyDescriptor(vm3, "bb")
                var vm1aa = Object.getOwnPropertyDescriptor(vm1, "aa")
                var vm2bb = Object.getOwnPropertyDescriptor(vm2, "bb")
                expect(aa).to.be.a("object")
                expect(aa.get).to.be.a("function")
                expect(aa.set).to.be.a("function")
                expect(aa.get).to.equal(
                        vm1aa.get)
                expect(bb.get).to.equal(
                        vm2bb.get)
                expect(aa.set).to.equal(
                        vm1aa.set)
                expect(bb.set).to.equal(
                        vm2bb.set)
            }
            var vm4 = adjustVm(vm3, "aa")
            var vm5 = adjustVm(vm3, "bb")
            expect(vm4).to.equal(vm1)
            expect(vm5).to.equal(vm2)
            expect(vm3.$events.aa.length).to.equal(2)
            expect(vm3.$events.bb.length).to.equal(1)
            //convergedModel是由构成它的各个vm的各种材料构成
            expect(vm3.$events.aa).to.equal(vm1.$events.aa)
            expect(vm3.$events.bb).to.equal(vm2.$events.bb)

            expect(vm3.$events).to.have.all.keys('aa', 'bb', '__vmodel__')
            expect(vm1.$events).to.have.all.keys('aa', '__vmodel__')
            expect(vm2.$events).to.have.all.keys('bb', '__vmodel__')
            vm3.$fire("aa", 1111)
            vm3.$fire("bb", 2222)
        })
    })



}

testCase(require("./compact"), "compact")

testCase(require("./modern"), "modern")


