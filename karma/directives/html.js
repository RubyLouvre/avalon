var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}

describe('html', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it('test', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='html' ms-html='@a' >111
             </div>
             */
        })
        vm = avalon.define({
            $id: 'html',
            a: '<p ms-html="@b">xxx</p>',
            b: '<b title="yyy">zzz</b><a>xxx</a>',
            c: '<i>司徒正美</i>'
        })
        avalon.scan(div, vm)
        var el = div.children[0]
        var prop = 'textContent' in div ? 'textContent': 'innerText'
        expect(el[prop]).to.equal('zzzxxx')
        vm.b = '<span>{{@c}}</span>'
        setTimeout(function () {
            expect(el[prop]).to.equal('<i>司徒正美</i>')
            done()
        })

    })
    it('test2', function (done) {
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="html2">
            <p><input ms-duplex="@a" />{{@a}}<strong ms-text="@a"></strong></p>
            <p><input ms-duplex="@b" /><span>{{@b}}</span><span ms-html="@b"></span></p>
            </div>
             */
        })
        vm = avalon.define({
            $id: 'html2',
            a: 111,
            b: 222
        })
        avalon.scan(div, vm)
        var el = div.getElementsByTagName('p')
        var prop = 'textContent' in div ? 'textContent': 'innerText'
        expect(el[0][prop]).to.equal('111111')
        expect(el[1][prop]).to.equal('222222')
        vm.b = '333'
        setTimeout(function () {
             expect(el[1][prop]).to.equal('333333')
            done()
        })

    })
     it('test3', function (done) {
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="html3" ms-html='@aaa'>
            </div>
             */
        })
        window.kkk20160630 = 1
        vm = avalon.define({
            $id: 'html3',
            bbb:111,
            aaa:'<b id="color">{{@bbb}}</b><script>window.kkk20160630= 20<\/script><style>#color{color:red}</style>'
        })
        avalon.scan(div, vm)

        setTimeout(function () {
            var el = document.getElementById('color')
            var color = avalon(el).css('color')
            expect(/rgb\(255,\s*0,\s*0\)|red/.test(color)).to.equal(true)
            expect(el.innerHTML).to.equal('111')
            expect(window.kkk20160630).to.equal(20)
            window.kkk20160630 = void 0
            done()
        }, 300)

    })
    
     it('能过ms-html动态加载控制器', function (done) {
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="html4">
            <div ms-html="@tpl"></div>
            </div>
             */
        })
        vm = avalon.define({
            $id: 'html4',
            tpl: ""
        })

        var vm2 = avalon.define({
            $id: 'html42',
            aaa: "aaaa"
        });

        avalon.scan(div)

        setTimeout(function () {
            vm.tpl = heredoc(function(){
                /*
<div ms-controller="html42">
    <span  ms-html="@aaa"></span>
</div>
                 */
            })
            vm2.aaa = 5555
            var el = div.getElementsByTagName('span')[0]
            expect(el.innerHTML).to.equal('5555')
            done()
        }, 300)

    })
})