var expect = chai.expect
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
describe('if', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement("div")
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it("test", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='if'>
             <p ms-if='@a' >{{@aa}}</p>
             <p ms-if='!@a' >{{@bb}}</p>
             </div>
             */
        })
        vm = avalon.define({
            $id: "if",
            a: true,
            aa: "第一页面",
            bb: "第二页面"
        })
        avalon.scan(div, vm)

        var ps = div.getElementsByTagName("p")
        expect(ps[0].innerHTML).to.equal('第一页面')
        vm.a = false
        setTimeout(function () {
            ps = div.getElementsByTagName("p")
            expect(ps[0].innerHTML).to.equal('第二页面')
            vm.a = true
           
            setTimeout(function () {
                ps = div.getElementsByTagName("p")
                expect(ps[0].innerHTML).to.equal('第一页面')
                done()
            })

        })
    })
    
    it("test02", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='if2'>
             <div class='panel' ms-for='(jj, el) in @panels' ms-if='jj === @curIndex' ms-html='el'></div>
             </div>
             */
        })
        vm = avalon.define({
            $id: "if2",
            curIndex: 1,
            panels: ["<div>面板1</div>", "<p>面板2</p>", "<strong>面板3</strong>"]
        })
        avalon.scan(div, vm)

        var ps =  byClass(div,'panel')
        var prop = 'textContent' in div ? 'textContent' : 'innerText'
        expect(ps[0][prop]).to.equal('面板2')
        vm.curIndex = 2
        setTimeout(function () {
            var ps = byClass(div,'panel')
           
            expect(ps[0][prop]).to.equal('面板3')
            vm.curIndex = 0
            setTimeout(function () {
                var ps =  byClass(div,'panel')
                expect(ps[0][prop]).to.equal('面板1')
                
                done()
            })

        })
    })
    
    it("ms-if+ms-on", function (done) {
        //https://github.com/RubyLouvre/avalon/issues/1344#issuecomment-217234216
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='if3'>
             <button ms-if="@isLogin" ms-click="@lgout" class='login'>成功</button>
             </div>
             */
        })
        var index = 0
        vm = avalon.define({
            $id: "if3",
            isLogin: 0,
            lgout: function () {
               index = 100
            }
        })
        avalon.scan(div, vm)
        setTimeout(function () {
            vm.isLogin = 1;
        }, 300);
       
        setTimeout(function () {
            var ps =  byClass(div,'login')
            expect(ps.length).to.equal(1)
            fireClick(ps[0]||{})
           
            setTimeout(function () {
                expect(index).to.equal(100)
                done()
            })

        },500)
    })
    
})

function byClass(el, className){
   var all = el.getElementsByTagName('*')
   var ret = []
    for(var i = 0,el; el = all[i++];){
       if(el.nodeType === 1 && el.className.indexOf(className) !== -1){
           ret.push(el)
       }
   }
   return ret
}