import { avalon } from '../../src/seed/core'
import { lookupOption } from '../../src/directives/duplex/option'
import { duplexBeforeInit } from '../../src/directives/duplex/share'
import { updateDataActions } from '../../src/directives/duplex/updateDataActions'


describe('duplex', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        if (div.parentNode === body) {
            body.removeChild(div)
            delete avalon.vmodels[vm.$id]
        }
    })
    it('数据转换', function (done) {
        avalon.filters.limit = function (str, a) {
            return String(str).slice(0, a)
        }
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex1' >
             <input ms-duplex-string='@aaa|limit(4)'><span>{{@aaa}}</span>
             <input ms-duplex-number='@bbb' ><span>{{@bbb}}</span>
             <input ms-duplex-boolean='@ccc' ><span>{{@ccc}}</span>
             <input ms-duplex-checked='@ddd' type='radio' ><span>{{@ddd}}</span>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex1',
            aaa: 1234567,
            bbb: '123a',
            ccc: 'true',
            ddd: true
        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var inputs = div.getElementsByTagName('input')
            var spans = div.getElementsByTagName('span')

            expect(inputs[0].value).toBe('1234')
            expect(vm.aaa).toBe(1234567)
            expect(spans[0].innerHTML).toBe('1234567')
            expect(inputs[1].value).toBe('123')
            expect(vm.bbb).toBe('123a')
            expect(spans[1].innerHTML).toBe('123a')
            expect(inputs[2].value).toBe('true')
            expect(vm.ccc).toBe('true')
            expect(spans[2].innerHTML).toBe('true')
            expect(vm.ddd).toBe(true)
            expect(spans[3].innerHTML).toBe('true')
            expect(inputs[3].checked).toBe(true)
            vm.bbb = '333b'
            vm.ccc = 'NaN'
            vm.ddd = false
            setTimeout(function () {
                expect(inputs[1].value).toBe('333')
                expect(vm.bbb).toBe('333b')
                expect(spans[1].innerHTML).toBe('333b')
                expect(inputs[2].value).toBe('false')
                expect(vm.ccc).toBe('NaN')
                expect(spans[2].innerHTML).toBe('NaN')
                expect(spans[3].innerHTML).toBe('false')
                expect(inputs[3].checked).toBe(false)
                done()
            }, 100)//chrome 37还是使用定时器，需要延迟足够的时间

        }, 100)

    })
    it('checkbox', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex2' >
             <input ms-duplex-number='@aaa' value='111' type='checkbox'>
             <input ms-duplex-number='@aaa' value='222' type='checkbox'>
             <input ms-duplex-number='@aaa' value='333' type='checkbox'>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex2',
            aaa: [333]

        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var inputs = div.getElementsByTagName('input')
            console.log(inputs[0].checked, inputs[1].checked, inputs[2].checked)
            expect(inputs[0].checked).toBe(false)
            expect(inputs[1].checked).toBe(false)
            expect(inputs[2].checked).toBe(true)

            fireClick(inputs[0])
            fireClick(inputs[1])
            fireClick(inputs[2])
            setTimeout(function () {
                expect(vm.aaa.concat()).toEqual([111, 222])
                done()
            }, 100)
        },300)//必须给够时间
    })

    it('select', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex3' >
             <select ms-duplex-number='@aaa' multiple="true">
             <option>111</option>
             <option>222</option>
             <option>333</option>
             <option>444</option>
             </select>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex3',
            aaa: [111, 444]

        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var options = div.getElementsByTagName('option')
            expect(options[0].selected).toBe(true)
            expect(options[1].selected).toBe(false)
            expect(options[3].selected).toBe(true)

            done()

        })
    })

    it('textarea & contenteditable', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex4'>
             <textarea ms-duplex='@aaa | uppercase'></textarea>
             <blockquote ms-duplex='@bbb | lowercase' contenteditable='true'><div>2222</div></blockquote>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex4',
            aaa: "aaa",
            bbb: "BBB"
        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var textareas = div.getElementsByTagName('textarea')
            var blockquote = div.getElementsByTagName('blockquote')

            expect(textareas[0].value).toBe('AAA')
            expect(blockquote[0].innerHTML).toBe('bbb')
            vm.aaa = "aaa_bbb"
            vm.bbb = 'fff_AAA'
            setTimeout(function () {
                expect(textareas[0].value).toBe('AAA_BBB')
                expect(blockquote[0].innerHTML).toBe('fff_aaa')
                done()
            }, 80)
        }, 100)
    })

    it('select2', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex5' >
             <select ms-duplex='@aaa'>
             <option>
             aaa
             </option>
             <option>
             bbb
             </option>
             <option>
             ccc
             </option>
             <option>
             ddd
             </option>
             <input ms-duplex="@aaa"><span>{{@aaa}}</span>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex5',
            aaa: "ccc"

        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var options = div.getElementsByTagName('option')
            var inputs = div.getElementsByTagName('input')
            var spans = div.getElementsByTagName('span')

            expect(options[0].selected + "1").toBe(false + "1")
            expect(options[1].selected + "2").toBe(false + "2")
            expect(options[2].selected + "3").toBe(true + "3")
            expect(options[3].selected).toBe(false)

            expect(spans[0].innerHTML).toBe('ccc')
            expect(inputs[0].value).toBe('ccc')
            inputs[0].value = 'bbb'

            done()

        }, 80)
    })
    it('select3', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex6' >
             <select ms-duplex-number='@arr' multiple='true'>
             <option>
             111
             </option>
             <option>
             222
             </option>
             <option>
             333
             </option>
             <option>
             444
             </option>
             </select>
             <p>{{@arr}}</p>
             </div>
             */
        })
        var vm = avalon.define({
            $id: 'duplex6',
            arr: [111, 444]
        })
        avalon.scan(div, vm)
        setTimeout(function () {

            var options = div.getElementsByTagName('option')
            var ps = div.getElementsByTagName('p')
            expect(options[0].selected).toBe(true)
            expect(options[1].selected).toBe(false)
            expect(options[2].selected).toBe(false)
            expect(options[3].selected).toBe(true)
            options[0].selected = false
            options[1].selected = true
            options[2].selected = true
            options[3].selected = false
            var element = div.getElementsByTagName('select')[0]
            var update = element._ms_duplex_.duplexCb
            update.call(element,{
                type: 'change'
            })
            setTimeout(function () {
                expect(vm.arr.concat()).toEqual([222, 333])
                expect(ps[0].innerHTML).toEqual([222, 333] + "")
                done()
            },130)
        }, 130)
    })

    it('通过更新修改checkbox中的ms-duplex', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex7' >
             <label ms-for="el in @list">
             <input ms-duplex="@topic" type="checkbox" ms-attr="{id:el.name,value:el.value}" name="topic">{{el.name}}
             </label>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex7',
            topic: ['1', '2'],
            list: [{ name: 'dog', value: '1' }, { name: 'bird', value: '2' }, { name: 'cat', value: '3' }],
        })
        avalon.scan(div, vm)
        setTimeout(function () {

            var inputs = div.getElementsByTagName('input')

            expect(inputs[0].checked).toBe(true)
            expect(inputs[1].checked).toBe(true)
            expect(inputs[2].checked).toBe(false)

            vm.topic = ['1', '3']
            setTimeout(function () {
                expect(inputs[0].checked).toBe(true)
                expect(inputs[1].checked).toBe(false)
                expect(inputs[2].checked).toBe(true)
                done()
            }, 100)
        }, 100)
    })
    it('ms-duplex+radio', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex8' >
             <label><input type="radio" ms-duplex-string="@isChecked" name="check" value="true">是</label>
             <label><input type="radio" ms-duplex-string="@isChecked" name="check" value="false">否</label>
             <p ms-text="@isChecked"></p>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex8',
            isChecked: ''
        })
        avalon.scan(div)
        setTimeout(function () {

            var inputs = div.getElementsByTagName('input')

            expect(inputs[0].checked).toBe(false)
            expect(inputs[1].checked).toBe(false)
            fireClick(inputs[0])
            setTimeout(function () {
                expect(vm.isChecked).toBe('true')

                fireClick(inputs[1])
                setTimeout(function () {
                    expect(vm.isChecked).toBe('false')

                    fireClick(inputs[0])
                    setTimeout(function () {
                        expect(vm.isChecked).toBe('true')
                        done()
                    }, 100)
                }, 100)
            }, 100)
        }, 100)

    })
    it('ms-duplex事件触发问题', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex9' >
             <input ms-duplex="@aaa"/><em>{{@aaa}}</em>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex9',
            aaa: ''
        })
        avalon.scan(div)
        setTimeout(function () {

            var input = div.getElementsByTagName('input')[0]
            input.value = 999
            avalon.fireDom(input, 'input')
            avalon.fireDom(input, 'propertychange')
            setTimeout(function () {
                expect(vm.aaa).toBe('999')
                var em = div.getElementsByTagName('em')[0]
                expect(em.innerHTML).toBe('999')
                done()
            }, 100)
        }, 100)

    })
    it('pollValue', function (done) {
        var pollValue = avalon.__pollValue
        if(!pollValue){
            done()
            return 
        }
        var el = document.createElement('input')
        el.composing = true
        document.body.appendChild(el)

        var id = pollValue.call({
            isString: true,
            dom: el
        }, NaN, true)
        expect(el.valueHijack).toA('function')
        expect(id).toA('number')
        setTimeout(function () {
            document.body.removeChild(el)
            setTimeout(function () {
                clearInterval(id)
                done()
            }, 100)
        }, 400)


    })

    it('lookupOption', function () {
        var props = {}
        var props2 = {
            value: 'yyy'
        }
        lookupOption({
            children: [{
                nodeName: 'optgroup',
                children: [
                    {
                        nodeName: 'option',
                        props: props,
                        children: [{
                            nodeName: '#document-fragment',
                            children: [{
                                nodeName: '#text',
                                nodeValue: 'xxx'
                            }]
                        }]
                    }
                ]
            }, {
                nodeName: 'option',
                props: props2,
                children: [{
                    nodeName: '#text',
                    nodeValue: 'zzz'
                }]

            }]
        }, ['xxx'])
        expect(props.selected).toBe(true)
        expect(props2.selected).toBe(false)
    })

    it('lookupOption2', function (done) {
        div.innerHTML = heredoc(function () {
            /*
                 <div ms-controller='lookupOption2'>
                 <select ms-duplex="@num">
                 <option ms-for="el in @numList">{{el}}</option>
                  </select>
                   <p>{{@num}}</p>
                   </div>
               */
        })
        vm = avalon.define({
            $id: 'lookupOption2',
            num: '222',
            numList: ['111', '222', '333']
        })
        avalon.scan(div)
        setTimeout(function () {
            var select = div.getElementsByTagName('select')[0]
            expect(avalon(select).val()).toBe('222')
            vm.num = '333'
            setTimeout(function () {
                expect(avalon(select).val()).toBe('333')
                done()
            }, 100)
        }, 100)
    })
    
    it('duplexBeforeInit', function(){
        var obj1 = {
            expr: '@aaa|change'
        }
        duplexBeforeInit.call(obj1)
        expect(obj1.expr).toBe('@aaa')
        expect(obj1.isChanged).toBe(true)
         var obj2 = {
            expr: '@aaa|debounce(33)'
        }
        duplexBeforeInit.call(obj2)
        expect(obj2.expr).toBe('@aaa')
        expect(obj2.debounceTime).toBe(33)
         var obj3 = {
            expr: '@aaa|debounce'
        }
        duplexBeforeInit.call(obj3)
        expect(obj3.expr).toBe('@aaa')
        expect(obj3.debounceTime).toBe(300)
    })
     it('updateDataActions', function(){
         var obj1= {
             value: '111',
             dom: {
                 value: '222',
                 checked: true
             }
         }
         updateDataActions.checkbox.call(obj1)
         expect(obj1.__test__).toEqual(['111'])
         
     })
    
})