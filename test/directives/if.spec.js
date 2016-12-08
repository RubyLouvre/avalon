import { avalon } from '../../src/seed/core'

describe('if', function() {
    var body = document.body,
        div, vm
    beforeEach(function() {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function() {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it('test', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='if1' ms-if='@aaa' class='ms-controller' >111
             </div>
             */
        })
        vm = avalon.define({
            $id: 'if1',
            aaa: false
        })
        avalon.scan(div)
        setTimeout(function() {
            expect(div.innerHTML).toMatch(/\<\!\-\-/)
            vm.aaa = true
            setTimeout(function() {
                expect(div.innerHTML).not.toMatch(/\<\!\-\-/)
                expect(div.innerHTML).toMatch(/111/)
                var dd = div.getElementsByTagName('div')[0]
                expect(dd.className).toBe('')
                done()
            }, 100)
        }, 100)

    })
    it('组件里的if', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='if2' >
             <xmp ms-widget="{is:'ms-like',likeFlag:true}"></xmp>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'if2',
            aaa: false
        })
        var vm2
        avalon.component('ms-like', {
            template: '\
                <div class="ms-like-wrap">\
                    <a href="javascript:void(0);" >\
                        <span ms-if="@likeFlag==true">取消赞!<\/span>\
                        <span ms-if="@likeFlag==false">赞<\/span>\
                    </a>\
                </div>',
            defaults: {
                likeFlag: false,onInit:function(e){
                    vm2 = e.vmodel
                }
            }
        });
        avalon.scan(div)
        setTimeout(function() {
            expect(div[textProp].replace(/[\r\n\s]/g,'')).toBe('取消赞!')
            vm2.likeFlag = false
            setTimeout(function() {
                expect(div[textProp].replace(/[\r\n\s]/g,'')).toBe('赞')
                delete avalon.components['ms-like']
                delete avalon.vmodels[vm2.$id]
                done()
            }, 100)
        }, 100)

    })
    it('ms-for+ms-if',function(done){
           div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='if3' >
              <div ms-for="($index,el) in @arr" ms-class="['quesBlock_'+$index,($index==@activeIndex?'active':'')]" > 
                <h5  ms-if="el.type > 0" class="quesName">
                  <span class="nameID">{{$index+1}}:</span>
                  <span> {{el.name}} </span>
                </h5>
              </div>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'if3',
            surveyName: {
                isHideNameID:false
              },
              activeIndex:0,
              arr: [
                {
                  type:0,
                  name:"Ques ONE"
                },
                {
                  type:7,
                  name:"Ques TWO"
                }
              ]
        })
      
        avalon.scan(div)
        setTimeout(function() {
            expect(div[textProp].replace(/[\r\n\s]/g,'')).toBe('2:QuesTWO')
           done()
        }, 100)
    })
    //https://github.com/RubyLouvre/avalon/issues/1851
     it('ms-duplex+ms-if',function(done){
           div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='if4' >
              <input ms-duplex='@aaa' ms-if='false'>
                  
             </div>
             */
        })
        vm = avalon.define({
            $id: 'if4',
            aaa:'11'
        })
        var a = 1
        try{
        avalon.scan(div)
        }catch(e){
            ++a
        }
        setTimeout(function() {
           expect(a).toBe(1)
           done()
        }, 100)
    })
})