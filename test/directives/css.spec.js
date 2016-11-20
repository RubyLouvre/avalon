import { avalon } from '../../src/seed/core'
import { deepEquals } from '../../src/directives/css'

describe('css', function () {

    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('background', function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='css1' ms-css='{background: @a}'>测试样式</div>
             */
        })

        vm = avalon.define({
            $id: 'css1',
            a: 'red'
        })
        avalon.scan(div)
        var css = div.children[0].style
        expect(css.backgroundColor).toBe('red')

        vm.a = '#a9ea00'
        setTimeout(function () {
            expect(css.backgroundColor).toMatch(/#a9ea00|rgb\(169, 234, 0\)/)
            vm.a = '#cdcdcd'
            setTimeout(function () {
                expect(css.backgroundColor).toMatch(/#cdcdcd|rgb\(205, 205, 205\)/)
                done()
            }, 100)
        }, 100)

    })

    it('float', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='css2' ms-css='{float:@a}'>测试样式</div>
             */
        })

        vm = avalon.define({
            $id: 'css2',
            a: 'right'
        })

        avalon.scan(div)
        var child = avalon(div.children[0])
        expect(child.css('float')).toBe('right')

        vm.a = 'left'
        vm.a = 'right'
        vm.a = 'left'
        setTimeout(function () {
            expect(child.css('float')).toBe('left')
            done()
        },100)

    })
    it('width', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='css3' ms-css="{width: @a}">测试样式</div>
             */
        })

        vm = avalon.define({
            $id: 'css3',
            a: 100
        })

        avalon.scan(div)

        expect(avalon(div.children[0]).width()).toBe(100)
        expect(div.children[0].style.width).toBe('100px')
        vm.a = 150
        setTimeout(function () {
            expect(avalon(div.children[0]).width()).toBe(150)
            expect(div.children[0].style.width).toBe('150px')

            done()
        })
    })

    it('opacity', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='css4' ms-css='{opacity:@a}'>测试样式</div>
             */
        })
        vm = avalon.define({
            $id: 'css4',
            a: 0.6
        })
        avalon.scan(div)
        var el = avalon(div.children[0])
        expect(Number(el.css('opacity')).toFixed(2)).toBe('0.60')

        vm.a = 8
        setTimeout(function () {
            expect(el.css('opacity')).toBe('1')
            done()
        })
    })

    it('array', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='css5' ms-css='[@aa,@bb]'>测试样式</div>
             */
        })
        vm = avalon.define({
            $id: 'css5',
            aa: {
                background: 'red'
            },
            bb: {
                width: 200,
                height: 200
            }
        })
        avalon.scan(div)
        setTimeout(function () {
            var el = avalon(div.children[0])
            expect(el.width()).toBe(200)
            expect(el.height()).toBe(200)
            expect(vm.aa.$model.width).toBe(void 0)
            expect(el.css('backgroundColor')).toMatch(/red|rgb\(255,\s*0,\s*0\)/)
            setTimeout(function () {
                vm.aa = {}
                //IE6-8下返回transparent
                expect(el.css('backgroundColor')).toMatch(/transparent|rgba\(0,\s*0,\s*0,\s*0\)/)
                done()
            }, 100)

        }, 100)


    })

    it('deepEquals', function () {
        expect(deepEquals(
            { a: [2, 3], b: [4] },
            { a: [2, 3], b: [4] })).toBe(true)

        expect(deepEquals(
            { x: 5, y: [6] },
            { x: 5, y: 6 })).toBe(false)
        expect(deepEquals(
            { x: 5, y: 4, z: 8 },
            { x: 5, y: 6 })).toBe(false)
        expect(deepEquals(
            { x: 5, y: { a: 4 } },
            { x: 5, y: { a: 4 } })).toBe(true)
        expect(deepEquals(
            [null, null, null], [null, null, null])).toBe(true)

        expect(deepEquals(
            [{ a: 3 }, { b: 4 }],
            [{ a: '3' }, { b: '4' }])).toBe(false)

        expect(deepEquals(3, 3)).toBe(true)
        expect(deepEquals({ a: 1 }, { a: 1 }, 0)).toBe(false)
        expect(deepEquals('aaa', 'aaa')).toBe(true)
        expect(deepEquals(3, 3)).toBe(true)
        expect(deepEquals(
            (function () { return arguments })(1, 2, 3),
            (function () { return arguments })(1, 2, 3))
        ).toBe(true)
        expect(deepEquals(
            [1, 2, 3],
            (function () { return arguments })(1, 2, 3))
        ).toBe(false)

        var d0 = new Date(1387585278000);
        var d1 = new Date('Fri Dec 20 2013 16:21:18 GMT-0800 (PST)');

        expect(deepEquals(d0, d1)).toBe(true)
        expect(deepEquals(null, void 0)).toBe(false)
        expect(deepEquals(void 0, void 0)).toBe(true)
        expect(deepEquals(null, 111)).toBe(false)
        expect(deepEquals([1, 2, 3], [4, 5, 6, 7, 8])).toBe(false)
        expect(deepEquals([{ a: 1 }, { b: 1 }], [{ a: 1 }, { b: 1 }])).toBe(true)
        expect(deepEquals([{ a: 1 }, { b: 1 }], [{ a: 1 }, { b: 2 }])).toBe(false)
        expect(deepEquals([], true)).toBe(false)
        expect(deepEquals({ a: 1 }, null)).toBe(false)
        expect(deepEquals(null, null)).toBe(true)
        expect(deepEquals({a:1,b:2}, {})).toBe(false)
        expect(deepEquals({a:1,b:2}, {d:1,c:2})).toBe(false)
    })
})