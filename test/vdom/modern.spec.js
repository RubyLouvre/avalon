import { avalon, vdom, VText, VComment, VElement, VFragment } from '../../src/vdom/modern'
describe('vdom', function () {
    describe('VElement', function () {
        it('test', function () {
            var el = new VElement('p', { title: '111' }, [])
            expect(el).toInstanceOf(VElement)
            expect(el).not.toHaveProperty('toDOM')
            expect(el).not.toHaveProperty('toHTML')
            expect(el.toDOM().title).toBe('111')
            expect(el.toHTML().toLowerCase()).toBe('<p title="111"></p>')
            if (avalon.modern) {
                var circle = new VElement('circle', {}, [])
                expect(circle.toDOM().nodeName).toBe('circle')

                var template = new VElement('template', {}, [
                    new VText('111')
                ])
                expect(template.toDOM().nodeName).toBe('TEMPLATE')


            }
        })
        it('xmp', function () {

            var xmp = new VElement('xmp', { 'for': 'eee', 'class': 'a b', style: 'border: 4px' }, [
                new VText('111')
            ])
            expect(xmp.toDOM().nodeName).toBe('XMP')

            expect(xmp.toDOM().className).toBe('a b')
            expect(xmp.toDOM().style.borderWidth).toMatch(/4/i)
        })
        it('noscript', function () {
            var noscript = new VElement('noscript', {}, [
                new VText('111')
            ])

            expect(noscript.toDOM().nodeName).toBe('NOSCRIPT')
            expect(noscript.toDOM().textContent).toBe('111')
        })
        it('label for', function () {
            var label = new VElement('label', { 'for': 'ddd' }, [
                new VText('111')
            ])
            expect(label.toDOM().getAttribute('for')).toBe('ddd')
        })
        it('option', function () {
            var option = new VElement('option', { 'value': 'eee' }, [
                new VText(' xxx ')
            ])
            expect(option.toDOM().text).toMatch('xxx')
            var dom = option.toDOM()
            if (avalon.modern) {

                expect(dom.textContent).toMatch(' xxx ')
            }
            expect(dom[textProp]).toMatch(/xx/)
            expect(dom.innerHTML).toBe(' xxx ')
            var option2 = new VElement('option', { 'value': 'eee' }, [
                new VText('')
            ])
            expect(option2.toDOM().text).toBe('')

            expect(option2.toDOM().innerText).toBe('')

            expect(option2.toDOM().innerHTML).toBe('')
        })
        it('style', function () {
            var style = new VElement('style', {}, [
                new VText('.blue{color:blue}')
            ])
            expect(style.toDOM().nodeName).toBe('STYLE')
        })
        it('script', function () {
            var script = new VElement('script', {}, [
                new VText('var a = 1')
            ])
            expect(script.toDOM().nodeName).toBe('SCRIPT')
            expect(script.toDOM().text).toBe('var a = 1')

        })

        it('input', function () {

            var input = new VElement('input', { type: 'password' }, [

            ], true)
            expect(input.toDOM().nodeName).toBe('INPUT')
            expect(input.toDOM().type).toBe('password')
            expect(input.toHTML()).toBe('<input type="password"/>')
            expect(vdom(input, 'toDOM').nodeName).toBe('INPUT')
        })

    })

    describe('VComment', function () {

        it('test', function () {
            var el = new VComment('aaa')
            expect(el).toInstanceOf(VComment)
            expect(el).not.toHaveProperty('toDOM')
            expect(el).not.toHaveProperty('toHTML')
            expect(el.nodeValue).toBe('aaa')
            expect(el.nodeName).toBe('#comment')
            expect(el.toDOM().nodeType).toBe(8)
            expect(el.toHTML()).toBe('<!--aaa-->')
            expect(vdom(el, 'toDOM')).toBe(el.dom)
        })
    })
    describe('VText', function () {

        it('test', function () {
            var el = new VText('aaa')
            expect(el).toInstanceOf(VText)
            expect(el).toHaveProperty('nodeValue')
            expect(vdom(el, 'toDOM')).toBe(el.dom)

            expect(avalon.domize(el)).toBe(el.dom)
        })
    })

    describe('VFragment', function () {

        it('test', function () {
            var el = new VFragment([])
            expect(el).toInstanceOf(VFragment)
            expect(el).not.toHaveProperty('toDOM')
            expect(el).not.toHaveProperty('toHTML')
            expect(el.children).toEqual([])
            expect(el.nodeName).toBe('#document-fragment')
            expect(el.toDOM().nodeType).toBe(11)
            expect(el.toHTML()).toBe('')
            expect(el.toDOM().nodeType).toBe(11)

        })
        it('test2', function () {

            var hasChildren = new VFragment([
                new VElement('p', {}, [
                    new VText('ooooo')
                ])
            ])
            expect(hasChildren.toDOM().childNodes.length).toBe(1)
            expect(hasChildren.toHTML()).toBe('<p>ooooo</p>')

        })
    })



    describe('vdom', function () {
        it('test', function () {
            var el = vdom(null, 'toHTML')
            expect(el).toBe('')
            var el2 = vdom(null, 'toDOM')
            expect(el2.nodeType).toBe(11)
            var f = {
                nodeName: '#document-fragment',
                children: []
            }
            var el3 = vdom(f, 'toHTML')
            expect(el3).toBe('')
            var el4 = vdom([{
                nodeName: '#text', nodeValue: '333'
            }, {
                nodeName: '#text', nodeValue: '444'
            }], 'toHTML')
            expect(el4).toBe('333444')
        })
    })

})