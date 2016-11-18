import { avalon, vdom } from '../../src/vdom/compact'

import { fromDOM } from '../../src/vtree/fromDOM'

describe('fromDOM', function () {


        it('remove empty text node', function () {
                var f = document.createElement('div')
                f.style.cssText = 'color:red;'
                var a = document.createTextNode('xxx')
                var b = document.createElement('p')
                f.appendChild(a)
                f.appendChild(b)
                f.appendChild(document.createTextNode(''))
                f.appendChild(document.createTextNode('&nbsp;'))
                var aa = fromDOM(f)[0]
                expect(aa.children.length).toBe(3)
        })
        it('value', function () {
                var div = document.createElement('div')
                div.innerHTML = heredoc(function () {
                        /*
                         <select value=11>
                         <option value='ddd'>222</option>
                         <option>11</option>
                         </select>
                         <input value='ddd' type=checkbox/>
                         <input value=1234 type=password />
                         <textarea value='eee'>fff</textarea>
                         */
                }).trim()
                var aa = fromDOM(div)[0]
                expect(aa.children.length).toBe(4)
                expect(aa.children[0].props.value).toBe('11')
                expect(aa.children[0].props.type).toBe('select-one')
                expect(aa.children[1].props.value).toBe('ddd')
                expect(aa.children[2].props.value).toBe('1234')
                expect(aa.children[3].props.value).toBe('fff')
        })
        it('selectedIndex', function () {
                var div = document.createElement('div')
                div.innerHTML = heredoc(function () {
                        /*
                         <select>
                         <option>1</option>
                         <option selected >2</option>
                         <option>3</option>
                         </select>
                         */
                })


                var root = fromDOM(div)[0]
                var select = root.children[0]

                expect(select.props.selectedIndex).toBe(1)
                expect(select.children.length).toBe(3)


        })
})
