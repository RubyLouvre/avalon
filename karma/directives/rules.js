
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
function fireClick(el) {
    if (el.click) {
        el.click()
    } else {
//https://developer.mozilla.org/samples/domref/dispatchEvent.html
        var evt = document.createEvent('MouseEvents')
        evt.initMouseEvent('click', true, true, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
        !el.dispatchEvent(evt);
    }
}
describe('验证规则', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('validate+rules', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="validate1">
             <form ms-validate="@validate" action='javascript:void(0)'>
             <p><input ms-duplex="@aaa" ms-rules='{required:@bbb}' >{{@aaa}}</p>
             <p><input id="vd1" ms-duplex="@ddd" ms-rules="{equalto:'vd2'}" >{{@ddd}}</p>
             <p><input id="vd2" value='333' /></p>
             <button type='submit'>dddd</button>
             </form>
             </div>
             */
        })
        var flag = 0
        vm = avalon.define({
            $id: "validate1",
            aaa: "",
            bbb: true,
            ddd: '333',
            validate: {
                onValidateAll: function (reasons) {
                    if (reasons.length) {
                        flag = 1
                    } else {
                        flag = 2
                    }
                }
            }
        })
        avalon.scan(div)
        var btn = div.getElementsByTagName('button')[0]

        fireClick(btn)
        setTimeout(function () {
            expect(flag).to.equal(1)
            setTimeout(function () {
                flag = 0
                vm.aaa = '22'
                fireClick(btn)
                setTimeout(function () {
                    expect(flag).to.equal(2)
                    done()
                })
            })
        })

    })

    it('pattern', function () {
        var elem = document.createElement('input')
        var v = avalon.validators
        elem.setAttribute("pattern", "[a-z]{3}")
        var field = {
            data: {},
            dom: elem
        }
        v.pattern.get(elem.value, field, function (v) {
            expect(v).to.equal(false)
        })
        elem.value = 'asd'
        v.pattern.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })
        field.data.pattern = /[\u4e00-\u9fa5a-z]{3}/
        elem.value = '1234'
        v.pattern.get(elem.value, field, function (v) {
            expect(v).to.equal(false)
        })
        elem.value = '你好啊'
        v.pattern.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })
    })

    it('digits', function () {
        var elem = document.createElement('input')
        var v = avalon.validators
        elem.value = '124.5'
        var field = {
            data: {},
            dom: elem
        }
        v.digits.get(elem.value, field, function (v) {
            expect(v).to.equal(false)
        })
        elem.value = '1245'
        v.digits.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })
    })
    it('required', function () {
        var elem = document.createElement('input')
        var v = avalon.validators
        elem.value = '124.5'
        var field = {
            data: {},
            dom: elem
        }
        v.required.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })
        elem.value = ''
        v.required.get(elem.value, field, function (v) {
            expect(v).to.equal(false)
        })
    })
    it('date', function () {
        var elem = document.createElement('input')
        var v = avalon.validators
        elem.value = '1984-02-18'
        var field = {
            data: {
                date: /^\d{4}-\d{2}-\d{2}$/
            },
            dom: elem
        }
        v.date.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })
        delete field.data.date
        v.date.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })
        elem.value = '1984-13-87'
        v.date.get(elem.value, field, function (v) {
            expect(v).to.equal(false)
        })
        elem.value = ''
        v.date.get(elem.value, field, function (v) {
            expect(v).to.equal(false)
        })
    })

    it('url', function () {
        var obj = {valid: [
                'http://www.foobar.com/'
                        , 'http://www.foobar.com:23/'
                        , 'http://www.foobar.com:65535/'
                        , 'http://www.foobar.com:5/'
                        , 'https://www.foobar.com/'
                        , 'ftp://www.foobar.com/'
                        , 'http://www.foobar.com/~foobar'
                        , 'http://user:pass@www.foobar.com/'
                        , 'http://user:@www.foobar.com/'
                        , 'http://127.0.0.1/'
                        , 'http://10.0.0.0/'
                        , 'http://189.123.14.13/'
                        , 'http://duckduckgo.com/?q=%2F'
                        , 'http://foobar.com/t$-_.+!*\'(),'
                        , 'http://localhost:3000/'
                        , 'http://foobar.com/?foo=bar#baz=qux'
                        , 'http://foobar.com?foo=bar'
                        , 'http://foobar.com#baz=qux'
                        , 'http://www.xn--froschgrn-x9a.net/'
                        , 'http://xn--froschgrn-x9a.com/'
                        , 'http://foo--bar.com'
                        , 'http://høyfjellet.no'
                        , 'http://xn--j1aac5a4g.xn--j1amh'
                        , 'http://кулік.укр'
            ]
        }
        var elem = document.createElement('input')
        var v = avalon.validators
        var field = {
            data: {},
            dom: elem
        }
        obj.valid.forEach(function (url) {
            elem.value = url
            v.url.get(elem.value, field, function (v) {
                expect(v).to.equal(true)
            })
        })

    })
    it('email', function () {
        var elem = document.createElement('input')
        var v = avalon.validators
        elem.value = 'test@example.com'
        var field = {
            data: {},
            dom: elem
        }
        v.email.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })
    })
    it('minlength', function () {
        var elem = document.createElement('input')
        var v = avalon.validators
        elem.value = 'test2example.com'
        var field = {
            data: {
                minlength: 12
            },
            dom: elem
        }
        v.minlength.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })
    })
    it('maxlength', function () {
        var elem = document.createElement('input')
        var v = avalon.validators
        elem.value = 'test2example.com'
        var field = {
            data: {
                minlength: 7
            },
            dom: elem
        }
        v.maxlength.get(elem.value, field, function (v) {
            expect(v).to.equal(false)
        })
    })
    it('max and min', function () {
        var elem = document.createElement('input')
        var v = avalon.validators
        elem.value = '44'
        var field = {
            data: {
                min: 7,
                max: 52
            },
            dom: elem
        }
        v.min.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })
        v.max.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })
        field.data.min = 46
        v.min.get(elem.value, field, function (v) {
            expect(v).to.equal(false)
        })
    })
    it('chs', function () {
        var elem = document.createElement('input')
        var v = avalon.validators
        elem.value = '44'
        var field = {
            data: {},
            dom: elem
        }
        v.chs.get(elem.value, field, function (v) {
            expect(v).to.equal(false)
        })
        elem.value = '司徒正美'
        v.chs.get(elem.value, field, function (v) {
            expect(v).to.equal(true)
        })

    })

})
