import { avalon } from '../../src/seed/core'

describe('controller', function() {
    var body = document.body,
        div, vm, h1, h2, h3, cdiv
    beforeEach(function() {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function() {
        body.removeChild(div)
        delete avalon.vmodels[vm && vm.$id]
    })


    it('default', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="root">
             <h1>{{@page}}</h1>
             <div ms-controller="first">
             <h2 ms-text="@page"></h2>
             <div ms-if="@page=='first'">
             <div ms-controller="second">
             <h3 ms-html="@page"></h3>
             <div ms-if="@page == 'second'" id="cdiv">{{@level}}-{{@page}}-{{@kind}}</div>
             </div>
             </div>
             </div>
             </div>
             */
        })
        body.appendChild(div)
        var root = avalon.define({
            $id: 'root',
            page: 'root',
            level: 'root'
        });
        var first = avalon.define({
            $id: 'first',
            page: 'first',
            kind: 'first'
        });
        var second = avalon.define({
            $id: 'second',
            page: 'second',
            grade: "second"
        });

        avalon.scan(div)

        setTimeout(function() {
            h1 = div.getElementsByTagName('h1')[0]
            h2 = div.getElementsByTagName('h2')[0]
            h3 = div.getElementsByTagName('h3')[0]
            cdiv = document.getElementById('cdiv')

            expect(h1.innerHTML).toBe(root.page)
            expect(h2.innerHTML).toBe(first.page)
            expect(h3.innerHTML).toBe(second.page)
            expect(cdiv.innerHTML).toBe([root.level, second.page, first.kind].join('-'))
            first.page = 'A'
            setTimeout(function() {
                h1 = div.getElementsByTagName('h1')[0]
                h2 = div.getElementsByTagName('h2')[0]
                h3 = div.getElementsByTagName('h3')[0]
                cdiv = document.getElementById('cdiv')

                expect(h1.innerHTML).toBe(root.page)
                expect(h2.innerHTML).toBe(first.page)
                expect(!!h3).toBe(false)
                expect(!!cdiv).toBe(false)

                first.page = 'first'
                second.page = 'B'
                setTimeout(function() {
                    h1 = div.getElementsByTagName('h1')[0]
                    h2 = div.getElementsByTagName('h2')[0]
                    h3 = div.getElementsByTagName('h3')[0]
                    cdiv = document.getElementById('cdiv')

                    expect(h1.innerHTML + "!").toBe(root.page + "!")
                    expect(h2.innerHTML + "!!").toBe(first.page + "!!")
                    expect(h3.innerHTML + "!!!").toBe(second.page + "!!!")
                    expect(!!cdiv).toBe(false)
                    setTimeout(function() {
                        delete avalon.vmodels.root
                        delete avalon.vmodels.first
                        delete avalon.vmodels.second
                        done()
                    })

                })


            }, 100)

        }, 100)


    })
    it('ms-controller 嵌套报错', function(done) {
        //https://github.com/RubyLouvre/avalon/issues/1811
        div.innerHTML = heredoc(function() {
            /*
              <div ms-controller="ctrl11">
 <blockquote ms-html="@tpl"></blockquote>
 <button ms-click="@switch1" type='button'>aaaa</button>
</div>
             */
        })
        var v123 = heredoc(function() {
            /*
            <div ms-controller="ctrl12">
            <p ms-click="@alert">123</p>
            {{@ggg.value}}
            </div>
            */
        })
        delete avalon.vmodels.ccc
        vm = avalon.define({
            $id: 'ctrl11',
            tpl: "",
            ggg: { value: 111 },
            switch1: function() {

                vm.tpl = v123
            }
        });

        var vm2 = avalon.define({
            $id: 'ctrl22',
            ddd: 'aaaa',
            alert: function() {
                avalon.log('????')
            }
        });
        avalon.scan(div)
        setTimeout(function() {
            var button = div.getElementsByTagName('button')[0]
            fireClick(button)
            console.log('33333')
            setTimeout(function() {
                var blockquote = div.getElementsByTagName('blockquote')[0]
                console.log(blockquote[textProp], '111')
                var text = blockquote[textProp].replace(/[\r\n\s]/g, '').trim()
                expect(text).toBe('123111')
                delete avalon.vmodels.ccc1
                done()

            }, 100)
        }, 100)


    })

    it('确保内部的onReady也能执行', function(done) {
        div.innerHTML = heredoc(function() {
            /*
              <div ms-controller="nest01">
             <div ms-controller="nest02">
             <div ms-controller="nest03">
             111
              </div>
              </div>
              </div>
             */
        })
        var add = ''
        vm = avalon.define({
            $id: "nest01"
        })
        vm.$watch('onReady', function() {
            add += '111'
        })
        var vm2 = avalon.define({
            $id: "nest02"

        })
        vm2.$watch('onReady', function() {
            add += '222'
        })
        var vm3 = avalon.define({
            $id: "nest03"

        })
        vm3.$watch('onReady', function() {
            add += '333'
        })
        avalon.scan(div)
        setTimeout(function() {
            expect(add).toBe('333222111')
            done()
            delete avalon.vmodels.nest03
            delete avalon.vmodels.nest02
        }, 100)
    })
})