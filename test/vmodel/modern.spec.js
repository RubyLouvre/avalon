import { avalon, afterCreate, platform } from
    '../../src/vmodel/modern'
import { Mutation } from
    '../../src/vmodel/Mutation'
import { Action } from
    '../../src/vmodel/Action'
import { canHijack as isObservable } from
    '../../src/vmodel/share'
describe('vmodel', function () {
    it('isObservable', function () {
        expect(isObservable('aaa', 'ccc')).toBe(true)
        expect(isObservable('$id', 'ccc')).toBe(false)
        expect(isObservable('$render', 'ccc')).toBe(false)
        expect(isObservable('$kkk', 'ccc')).toBe(false)
        expect(isObservable('aaa', function () { })).toBe(false)
        expect(isObservable('aaa', new Date)).toBe(false)
        expect(isObservable('aaa', new Error(111))).toBe(false)
        expect(isObservable('aaa', null)).toBe(true)
        expect(isObservable('aaa', void 0)).toBe(true)
        expect(isObservable('aaa', document.createTextNode('222'))).toBe(false)
    })
    it('vmodel', function () {
        try {
            avalon.define({
                aaa: 1
            })
        } catch (e) {
            expect('error').toBe('error')
        }
        var vm = avalon.define({
            $id: "aaa",
            aaa: 1,
            bbb: null,
            $render: 11
        })

        try {
            vm = avalon.define({
                $id: "aaa",
                aaa: 1
            })
        } catch (e) {
            expect('has defined').toBe('has defined')
        }

        var called = false
        var unwatch = vm.$watch('aaa', function (a) {
            called = a
        })
        var unwatch2 = vm.$watch('aaa', function (a) {

        })
        expect(vm.$id).toBe("aaa")
        expect(vm.hasOwnProperty).toA("function")
        expect(vm.$model).toEqual({
            aaa: 1
        })
        expect(vm.$hashcode).toMatch(/^\$\d+/)
        expect(vm.$fire).toA('function')
        expect(vm.$watch).toA('function')
        expect(vm.$events).toA('object')
        expect(vm.$events.aaa.length).toBe(2)
        vm.$fire('aaa', '56')
        expect(called).toBe('56')
        unwatch()
        unwatch2()
        expect(vm.$events.aaa).toA('undefined')
        vm.$hashcode = false
        delete avalon.vmodels.aaa
    })
    it('hasSubObject', function () {

        var vm = avalon.define({
            $id: "bbb",
            a: 2,
            aaa: {
                bbb: 1,
                ccc: 2
            },
            arr: [1, 2, 3]
        })
        expect(vm.$model).toEqual({
            a: 2,
            aaa: {
                bbb: 1,
                ccc: 2
            },
            arr: [1, 2, 3]
        })
        vm.a = 3
        var d = vm.aaa
        vm.a = 3
        expect(vm.aaa.$events).toA('object')
        expect(vm.aaa.$fire).toA('undefined')
        expect(vm.aaa.$watch).toA('undefined')
        expect(vm.arr.$events).toA('object')
        expect(vm.arr.remove).toA('function')
        expect(vm.arr.removeAll).toA('function')
        expect(vm.arr.clear).toA('function')
        delete avalon.vmodels.bbb
    })

    it('list', function () {

        var vm = avalon.define({
            $id: 'ccc',
            array: [1]
        })
        var l = vm.array.push({ a: 1 })
        expect(l).toBe(2)
        l = vm.array.pushArray([1, 2, 3])
        expect(l).toBe(5)
        vm.array.unshift(7)
        expect(vm.array[0]).toBe(7)
        var a = vm.array.ensure(8)
        expect(a).toBe(true)
        var b = vm.array.ensure(7)
        expect(b).toBe(false)
        vm.array.removeAll(function (a) {
            return typeof a === 'object'
        })
        expect(vm.array.length).toBe(6)
        var c = vm.array.pop()
        expect(c).toBe(8)
        var d = vm.array.shift()
        expect(d).toBe(7)
        vm.array.removeAll([1, 1, 2])
        expect(vm.array.$model).toEqual([3])
        vm.array.set(0, 2)
        expect(vm.array.$model).toEqual([2])
        vm.array.push(5, 6, 7)
        var a = vm.array.removeAt(0)
        expect(a).toEqual([2])
        vm.array.removeAll()
        expect(vm.array.length).toEqual(0)
        vm.array.splice(0, 0, 4, 5, 6)
        vm.array.clear()
        expect(vm.array.length).toEqual(0)
        a = vm.array.removeAt(8)
        expect(a).toEqual([])
        vm.array.unshift(8, 9, 10)
        vm.array.remove(10)
        expect(vm.array.$model).toEqual([8, 9])
        try {
            vm.array.set(100, 4)
        } catch (e) {
            expect(e).toInstanceOf(Error)
        }
        var arr = vm.array.removeAt('aaa')
        expect(arr).toEqual([])
    })

    it('afterCreate', function () {

        var oldIE = avalon.msie
        avalon.msie = 6
       
        var vm = {
            $accessors: {
                aa: {
                    get: function () { },
                    set: function () { },
                    enumerable: true,
                    configurable: true
                }
            },
            $events: {},
            $id: 'test'
           
        }
        var core = {
            aaa: 111,
            bbb: 111
        }
        var keys = ['aaa','bbb','aa']
        
        afterCreate(vm, core, keys)
        expect(vm.$events.__proxy__).toBe(vm)
        expect(vm.$track.length > 8).toBe(true)
        expect(vm.hasOwnProperty('aaa')).toBe(true)
        expect(vm.hasOwnProperty('ccc')).toBe(false)
        var testA = {
            $id: 'aaa',
            arr: [1, 2, 3],
            obj: {
                a: 1,
                b: 2
            },
            c: 88,
            $track: 'arrȢobjȢc'
        }
        var method = avalon.modern ? platform.toJson : platform.toModel
        method(testA)
        var $model = method(testA)
        expect($model).toA('object')
        expect($model.$id).toA('undefined')
        avalon.msie = oldIE


    })


})



//
//describe('itemFactory', function () {
//    it('test', function () {
//        var vm = avalon.define({
//            $id: 'xcvdsfdsf',
//            a: 1,
//            b: '2',
//
//            c: new Date,
//            d: function () { },
//            $e: 33
//        })
//        var vm2 = platform.itemFactory(vm, {
//            data: {
//                dd: 11,
//                $cc: 22
//            }
//        })
//        expect(vm2.d).toA('function')
//        delete avalon.vmodels.xcvdsfdsf
//    })
//    it('不会互相干扰', function () {
//        var vm = avalon.define({
//            $id: 'xxx32',
//            kkk: 232
//        })
//        var vm2 = platform.itemFactory(vm, {
//            data: {
//                value: 111
//            }
//        })
//        var vm3 = platform.itemFactory(vm, {
//            data: {
//                value: 444
//            }
//        })
//        expect(vm2.value).toBe(111)
//        expect(vm3.value).toBe(444)
//        vm3.value = 888
//        expect(vm2.value).toBe(111)
//        expect(vm3.value).toBe(888)
//        delete avalon.vmodels.xxx32
//    })
//})

describe('Mutation', function () {
    it('test', function () {
       
    })
})
describe('Computed', function () {
    it('test', function () {
      var vm =  avalon.define({
            $id: 'computed01',
            $computed: {
                c: function(){
                    return this.a+ this.b
                },
                d: {
                    get:function(){
                        return this.a+' '+this.b
                    },
                    set:function(arr){
                        arr = arr.split(' ')
                        this.a = ~~arr[0]
                        this.b = ~~arr[1]
                    }
                }
            },
            a: 1,
            b: 2
        })
        expect(vm.c).toBe(3)
        vm.a = 10
        expect(vm.c).toBe(12)
        vm.b = 10
        expect(vm.c).toBe(20)
        expect(vm.d).toBe('10 10')
        vm.d = '12 13'
        expect(vm.a).toBe(12)
      
        expect(vm.b).toBe(13)
        expect(vm.c).toBe(25)
        delete avalon.vmodels.computed01
    })
})
describe('Action', function () {
    it('test', function () {
        
    })

})