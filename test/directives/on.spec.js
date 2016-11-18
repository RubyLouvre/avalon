import { avalon } from '../../src/seed/core'

describe('on', function () {
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
             <div ms-controller='on' ms-click='@a($event)' ms-click-2='@d = true' data-aaa=eee >111
             <div ms-click=@b($event,111) id='a111'>
             
             </div>
             </div>
             */
        })
        var index = 1
        vm = avalon.define({
            $id: 'on',
            d: false,
            a: function (e) {
                index++
                expect(e.currentTarget.getAttribute('data-aaa')).toBe('eee')
            },
            b: function (e, b) {
                index++
                expect(e.type).toBe('click')
                expect(b).toBe(111)
            }
        })
        avalon.scan(div)
        var elem = document.getElementById('a111')
        fireClick(elem)
        setTimeout(function () {
            expect(index).toBe(3)
            
            done()
        }, 100)
    })

    it('stopPropagation', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='on2' ms-click='@a($event)' data-aaa=eee >111
             <div ms-click=@b($event,33) id='a222'>
             
             </div>
             </div>
             */
        })
        var index = 1
        vm = avalon.define({
            $id: 'on2',
            a: function (e) {
                index++
            },
            b: function (e, b) {
                index++
                expect(e.type).toBe('click')
                expect(b).toBe(33)
                e.stopPropagation()
            }
        })
        avalon.scan(div, vm)
        var elem = document.getElementById('a222')
        fireClick(elem)
        setTimeout(function () {
            expect(index).toBe(2)
            done()
        })
    })

    it('stop:filter', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='on3' ms-click='@a($event)' data-aaa=eee >111
             <div ms-click='@b($event,33) |stop' id='a222'>
             
             </div>
             </div>
             */
        })
        var index = 1
        vm = avalon.define({
            $id: 'on3',
            a: function (e) {
                index++
            },
            b: function (e, b) {
                index++
                expect(e.type).toBe('click')
                expect(b).toBe(33)
            }
        })
        avalon.scan(div, vm)
        var elem = document.getElementById('a222')
        fireClick(elem)
        setTimeout(function () {
            expect(index).toBe(2)
            done()
        })
    })

    it('multi-click-bind', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='on4' 
             id='a33'
             ms-click='@a' 
             ms-click-2='@c' 
             ms-click-4='@b' 
             ms-click-1='@d'>TEST</div>
             */
        })
        var str = ""
        var vm = avalon.define({
            $id: 'on4',
            a: function (e) {
                str += "a"
            },
            b: function (e) {
                str += "b"
            },
            c: function (e) {
                str += "c"
            },
            d: function (e) {
                str += "d"
            }
        })

        avalon.scan(div, vm)
        var elem = document.getElementById('a33')
        fireClick(elem)
        setTimeout(function () {
            expect(str).toBe("adcb")
            done()
        })
    })
    it('ms-for+ms-on', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <blockquote ms-controller='on5' >
             <div ms-click='@callback' ms-for='($index, el) in @panels' ms-html='el'></div>
             </blockquote>
             */
        })
        var i = 0
        var map = [
            function (str) {
                expect(str).toBe('面板1')
            },
            function (str) {
                expect(str).toBe('面板2')
            },
            function (str) {
                expect(str).toBe('面板3')
            }
        ]
        
        vm = avalon.define({
            $id: "on5",
            curIndex: 0, //默认显示第一个,
            callback: function (e) {
                map[this.$index](e.target.innerHTML)
            },
            panels: ["面板1", "面板2", "面板3"]
        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var divs = div.getElementsByTagName('div')
            fireClick(divs[0])
            fireClick(divs[1])
            fireClick(divs[2])
            done()
        },100)


    })

    it('ms-on-dblclick', function (done) {
        //https://github.com/RubyLouvre/avalon/issues/1582
        div.innerHTML = heredoc(function () {
            /*
             <blockquote ms-controller='on6'ms-dblclick='@callback' >xxx</blockquote>
             */
        })
        var i = 0
        vm = avalon.define({
            $id: "on6",
            callback: function (e) {
                ++i
            },
            panels: ["面板1", "面板2", "面板3"]
        })
        avalon.scan(div)
        setTimeout(function () {
            var divs = div.getElementsByTagName('blockquote')
            fireClick(divs[0])
            setTimeout(function () {
                expect(i).toBe(0)
                done()
            }, 150)
        }, 150)
    })

    it('复杂路径的事件绑定', function (done) {
        //https://github.com/RubyLouvre/avalon/issues/1582
        div.innerHTML = heredoc(function () {
            /*
             <span ms-controller='on7'ms-click='@aaa.bbb' >xxx</span>
             */
        })
        var i = 0
        vm = avalon.define({
            $id: "on7",
            aaa: {
                bbb: function () {
                    ++i
                }
            }

        })
        avalon.scan(div)
        setTimeout(function () {
            var divs = div.getElementsByTagName('span')
            fireClick(divs[0])
            setTimeout(function () {
                expect(i).toBe(i)
                done()
            }, 150)
        }, 150)
    })
    
     it('enter过滤器', function (done) {
        //https://github.com/RubyLouvre/avalon/issues/1582
        div.innerHTML = heredoc(function () {
            /*
             <input ms-controller='on8'ms-keyup='@fn | enter' />
             */
        })
        var i = 0
        vm = avalon.define({
            $id: "on8",
            fn: function(e){
                e.target.value = ++i
            }
        })
        function keyup(el, code){
            if(document.createEvent){
                 var event = document.createEvent('HTMLEvents');
                event.initEvent('keyup',true,true)
                event.keyCode = code
                el.dispatchEvent(event)
            }else{
                event = document.createEventObject()
                event.eventType = 'keyup';
                event.which = event.keyCode = code
                el.fireEvent('onkeyup', event);
            }
        }
        avalon.scan(div)
        var input = div.getElementsByTagName('input')[0]
         keyup(input, 11)
        setTimeout(function () {
         
           expect(input.value).not.toBe(1)
           keyup(input, 13)
            setTimeout(function () {
                expect(input.value).not.toBe(1)
                done()
            }, 100)
        }, 100)
    })
    
     it('三重循环+事件', function (done) {
          div.innerHTML = heredoc(function () {
            /*
              <div ms-controller="on9">
     <div ms-for="big in @bigs">
      <div ms-for="cen in big.cens">
        <ul>
          <li ms-text="cen.msg" ms-click="@handle(cen)"></li>
        </ul>
      </div>
    </div>
             */
        })
        vm = avalon.define({
            $id: 'on9',
            bigs:[{
              cens:[{
                msg:11
              },
              {
                msg:22
              }]
            }],
            handle:function(cen){
            }
        })
        avalon.scan(div)
        setTimeout(function(){
           var lis = div.getElementsByTagName('li')
           expect(lis.length).toBe(2)
           expect(lis[0].getAttribute('avalon-events')).toMatch(/click\:/)
           expect(lis[1].getAttribute('avalon-events')).toMatch(/click\:/)
           done()
        }, 100)
     })
})

