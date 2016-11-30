import { avalon } from '../../src/seed/core'
import { getDuplexType } from '../../src/dom/val/modern'

describe('value', function () {
    var a, b, c, d, e, f
    beforeEach(function () {
        a = document.createElement("option");
        var div = document.createElement('div')
        div.innerHTML = '<input type="radio" /><input type="checkbox" />'
        b = div.children[0]
        c = div.children[1]
        d = document.createElement('textarea')
        e = document.createElement('select')
        f = document.createElement('input')
    })
    if (avalon.modern) {
        it('option', function () {
            a[textProp] = ' 111 '
            expect(a.value).toBe('111')
            a.setAttribute('value', ' 222 ')
            expect(a.value).toBe(' 222 ')
        })
        it('getDuplexType', function () {

            expect(getDuplexType(a)).toBe('option')
            expect(getDuplexType(b)).toBe('checked')
            expect(getDuplexType(c)).toBe('checked')
            expect(getDuplexType(d)).toBe('textarea')
            expect(getDuplexType(e)).toBe('select')
            expect(getDuplexType(f)).toBe('text')
        })

        it('fn.val', function () {
            expect(avalon(a).val()).toBe('')
            avalon(a).val(333)
            expect(avalon(a).val()).toBe('333')
            avalon(f).val('dd')
            expect(avalon(f).val()).toBe('dd')
            e.options.add(new Option("aa", "111"))
            e.options.add(new Option("bb", "222"))
            e.options.add(new Option("cc", "333"))
            expect(avalon(e).val()).toBe('111')
            avalon(e).val('222')
            expect(avalon(e).val()).toBe('222')
            expect(e.children[1].selected).toBe(true)
            e.multiple = true
            e.options.add(new Option("dd", "444"))
            e.children[0].disabled = true
            expect(avalon(e).val()).toEqual(['222'])
            avalon(e).val([])
            expect(e.children[1].selected).toBe(false)
        })
        it('处理optgroup', function () {
              var div = document.createElement('div')
              div.innerHTML = heredoc(function(){
                  /*
                   <select multiple=true >
                  <optgroup>
                  <option selected>111</option>
                   <option value='222' selected>2222</option>
                   <option>333</option>
                  </optgroup>
                   <optgroup>
                   <option selected='true' disabled='disabled' >444</option>
                   <option value='fff' selected>hhh</option>
                   <option>kkk</option>
                  </optgroup>
                   <optgroup disabled='disabled'>
                   <option selected >5555</option>
                   <option selected >6666</option>
                   <option>777</option>
                  </optgroup>
                  </select>
                   */
              })
             var el = div.getElementsByTagName('select')[0]
             expect(avalon(el).val()).toEqual(['111','222','fff'])
          })
    }
})
