var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
describe('节点对齐算法', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('在chrome与firefox下删掉select中的空白节点，会影响到selectedIndex', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <!--""-->
             <select ms-controller="reconcile1">
             <option selected="true">111</option>
             <option>222</option>
             <option>333</option>
             <option>444</option>
             </select>
             */
        })
        vm = avalon.define({
            $id: 'reconcile1',
            a: true
        })
        avalon.scan(div)

        setTimeout(function () {
            var el = div.getElementsByTagName('select')[0]
            expect(el.selectedIndex).to.equal(0)
            done()

        }, 100)
    })

    it('当注释节里面包含HTML,HTML里面有属性,就会崩溃BUG', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="reconcile2">
             <!--<div class="xxx"></div>-->
             <span ms-for="el in @arr">
             {{el}}
             </span>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'reconcile2',
            arr: [1, 2, 3]
        })
        avalon.scan(div)
        setTimeout(function () {
            expect(div.getElementsByTagName('span').length).to.equal(3)
            done()
        }, 100)
    })
    it('&lt;&gt; BUG', function (done) {
        div.innerHTML =  heredoc(function () {
            /*
             <div ms-controller="reconcile3">
             <style>
             kbd {
             padding: 2px 4px;
             font-size: 90%;
             color: #fff;
             background-color: #333;
             border-radius: 3px;
             -webkit-box-shadow: inset 0 -1px 0 rgba(0, 0, 0, .25);
             box-shadow: inset 0 -1px 0 rgba(0, 0, 0, .25);
             }
             </style>
             <code>&lt;a&gt;</code><br/>
             <b ms-html="@wenti1"></b>
             <p ms-for="item in @wenti2">问题{{item+1}}:{{ item < 1 ? '小于1' : item > 1 ? '大于1' : item }}</p>
             </div>
             */
        })


        vm = avalon.define({
            $id: 'reconcile3',
            wenti1: '它使用了不同于传统 <kbd>&lt;script&gt;</kbd> 标签的脚本加载步骤',
            wenti2: [0, 1, 2]
        })
        avalon.scan(div)
        setTimeout(function () {
            var code = div.getElementsByTagName('code')[0]
            expect(code && code.innerHTML).to.equal('&lt;a&gt;')
            var kbd = div.getElementsByTagName('kbd')[0]
            expect(kbd && kbd.innerHTML).to.equal('&lt;script&gt;')
            var ps = div.getElementsByTagName('p')
            expect(ps.length).to.equal(3)
            expect(ps[0].innerHTML).to.equal('问题1:小于1')
            expect(ps[1].innerHTML).to.equal('问题2:1')
            expect(ps[2].innerHTML).to.equal('问题3:大于1')
            done()
        }, 100)
    })

    it('多个&nbsp; BUG', function (done) {
        div.innerHTML =  heredoc(function () {
            /*
             <div ms-controller="reconcile4">
             <xmp cached='true' ms-widget="{is:'ms-pager2',$id:'xxx'}"></xmp>
             </div>
             */
        })

        var tpl = heredoc(function () {
            /*
             <div class="pageNum dib">页,共&nbsp;{{@totalPages}}&nbsp;页</div>
             */
        })

        vm = avalon.define({
            $id: 'reconcile4'
        });

        avalon.component('ms-pager2', {
            template: tpl,
            defaults: {
                totalPages: 0,
                onReady: function(){
                    delete avalon.components['ms-pager2']
                }
            }
        });
        avalon.scan(div)
        setTimeout(function () {
            var a = div.innerText || div.textContent
            expect(a.indexOf('&nbsp;')).to.equal(-1)
          delete avalon.scopes.xxx
          delete avalon.vmodels.xxx
            done()
        }, 100)
    })

})