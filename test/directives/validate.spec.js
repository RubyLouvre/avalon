import { avalon } from '../../src/seed/core'
describe('validate', function () {
    var body = document.body, div, vm, originalTimeout;
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)

        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;


    })
    afterEach(function () {
        body.removeChild(div)
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        delete avalon.vmodels[vm && vm.$id]
    })

    it('test', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <form ms-validate="@validate" ms-controller='validate1' action="javascript: void(0)">
             <p>
             <input ms-duplex="@aaa" placeholder="username" ms-rules='{required:true,chs:true}'>{{@aaa}}</p>
             <p>
             <input type="password" id="pw" placeholder="password" ms-rules='{required:true}' ms-duplex="@bbb" />
             </p>
             <p>
             <input type="password" ms-rules='{required:true,equalto:"pw"}' placeholder="再填一次" ms-duplex="@ccc | change" />
             </p>
             <p>
             <button type="submit" >submit</button>
             </p>
             </form>
             */
        })
        var args1 = []
        var validate = {
            onError: function () {

            },
            deduplicateInValidateAll: true,
            onValidateAll: function (a) {
                args1 = a
            },
            validateInKeyup: false
        }
        spyOn(validate, 'onError')
        spyOn(validate, 'onValidateAll')
        vm = avalon.define({
            $id: "validate1",
            aaa: '',
            bbb: '',
            ccc: '',
            validate: validate
        })
        avalon.scan(div)
        vm.aaa = '1234'
        vm.bbb = 111
        vm.ccc = 111
        var btn = div.getElementsByTagName('button')[0]
        fireClick(btn)
        setTimeout(function () {
            expect(validate.onValidateAll).toHaveBeenCalled()
            console.log('validate')
            var args = validate.onValidateAll.calls.argsFor(0)
            var first = args[0]
            expect(first.length).toBe(1)
            expect(first[0].getMessage()).toBe('必须是中文字符')
            expect(first[0].message).toBe('必须是中文字符')

            expect(validate.onError).not.toHaveBeenCalled();

            vm.aaa = "司徒正美"
            fireClick(btn)
            setTimeout(function () {
                expect(validate.onValidateAll.calls.count()).toBe(2)
                expect(validate.onValidateAll.calls.argsFor(1)[0]).toEqual([])
                done()
            }, 300)

        },100)
    })
    it('getMessage,onSuccess,onError,onComplete', function (done) {
        var valiDir = avalon.directives.validate
        var elem = document.createElement('input')
        elem.value = 'test2example.com'
        var flag = false
        var foo = {
            onComplete: function () {
            },
            onError: function () {
            },
            onSuccess: function () {
            }
        }
        spyOn(foo, 'onComplete')
        spyOn(foo, 'onError')
        spyOn(foo, 'onSuccess')
        //开始测试
        var options = {
            value: elem.value,
            dom: elem,
            validator: foo,
            rules: {
                maxlength: 7
            }
        }
        valiDir.validate(options, false).then(function (a) {
            expect(a[0].getMessage()).toBe('最多输入7个字')
            expect(foo.onError).toHaveBeenCalled()
            expect(foo.onComplete).toHaveBeenCalled()
            elem.value = '33'
            options.value = '33'
            //第二轮测试

            valiDir.validate(options, false).then(function (a) {
                expect(a.length).toBe(0)
                expect(foo.onSuccess).toHaveBeenCalled()
                flag = true
                done()
            })

        })


    })
    
    it('如果定义了立即返回', function () {
          var valiDir = avalon.directives.validate
          var ret = valiDir.diff.call({
              node: {
                  validator: 1
              }
          })
          expect(ret).toBe(void 0)
     })
    it('禁用目标规则', function (done) {
        var valiDir = avalon.directives.validate
        var elem = document.createElement('input')
        elem.value = 'test2example.com'

        //开始测试
        var options = {
            value: elem.value,
            dom: elem,
            validator: {},
            rules: {
                maxlength: false
            }
        }
        valiDir.validate(options, true).then(function (a) {
            expect(a.length).toBe(0)

            done()


        })

    })

    it('去重', function (done) {
        var valiDir = avalon.directives.validate
        var div = document.createElement('div')
        var inputOK = document.createElement('input')
        var inputDisabled = document.createElement('input')
        var inputOff = document.createElement('input')
        div.appendChild(inputOK)
        div.appendChild(inputDisabled)
        function Field(dom, rules) {
            this.dom = dom
            this.value = 'dfdsgsdfgffg'
            this.rules = rules || {
                maxlength: 4
            }
        }
        valiDir.validateAll.call({
            dom: div,
            fields: [
                new Field(inputOK),
                new Field(inputOK),
                new Field(inputDisabled),
                new Field(inputOK, {
                    digits: true
                }),
                new Field(inputOff)
            ],
            onValidateAll: function (arr) {
                expect(arr.length).toBe(2)
                done()
            },
            deduplicateInValidateAll: true
        })
    })
    



})