import { avalon } from '../../src/seed/core'
import {
    css3,
    animation,
    transition,
    animationEndEvent,
    transitionEndEvent
} from '../../src/effect/detect'
import {
    getAction,
    getAnimationTime
} from '../../src/effect/index'

describe('effect', function() {
    var body = document.body,
        div, vm
    beforeEach(function() {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function() {
        body.removeChild(div)
        delete avalon.vmodels[vm && vm.$id]
    })
    it('type', function() {
        if (!avalon.msie || avalon.msie > 9) {
            console.log({
                css3,
                animation,
                transition,
                animationEndEvent,
                transitionEndEvent
            })
            expect(css3).toA('boolean')
            expect(animation).toA('boolean')
            expect(transition).toA('boolean')
            expect(typeof animationEndEvent).toMatch(/undefined|string/)
            expect(typeof transitionEndEvent).toMatch(/undefined|string/)
        }
    })
    it('getAction', function() {
        expect(getAction({ hook: 'onEnterDone' })).toBe('enter')
        expect(getAction({ hook: 'onLeaveDone' })).toBe('leave')
    })
    it('diff', function() {
        var diff = avalon.directives.effect.diff
        expect(diff.call({
            node: {
                props: {}
            }
        }, { color: 'green' })).toBe(true)
        expect(diff.call({
            oldValue: {
                color: 'green'
            },
            node: {
                props: {}
            }
        }, {
            color: 'green'
        })).toBe(false)
    })
    it('avalon.effect', function() {
        avalon.effect('fade')
        var fade = avalon.effects.fade
        if (!avalon.msie || avalon.msie > 9)
            expect(fade).toEqual({
                enterClass: 'fade-enter',
                enterActiveClass: 'fade-enter-active',
                leaveClass: 'fade-leave',
                leaveActiveClass: 'fade-leave-active'
            })
        delete avalon.effects.fade
    })


    it('avalon.effect#update', function(done) {
        avalon.effect('fade')
        var update = avalon.directives.effect.update
        var vdom = {
            dom: document.createElement('div')
        }
        expect(update(vdom, {})).toBe(void 0)
        expect(update(vdom, { is: 'xxx' })).toBe(void 0)

        expect(update(vdom, { is: 'fade', action: 'xxx' })).toBe(void 0)
        var effectProto = avalon.Effect.prototype
        var old = effectProto.enter
        var called = false
        effectProto.enter = function() {
            called = true
        }
        expect(update(vdom, { is: 'fade', action: true })).toBe(true)
        expect(update(vdom, { is: 'fade', action: true, queue: true })).toBe(true)
        setTimeout(function() {
            expect(called).toBe(true)
            effectProto.enter = old
            delete avalon.effects.fade
            done()
        }, 100)
    })

    it('getAnimationTime', function() {
        if (!avalon.msie || avalon.msie > 9) {
            var el = document.createElement('div')
            el.style.cssText = 'color:red;transition:all 2s; -moz-transition: all 2s; -webkit-transition: all 2s; -o-transition:all 2s;'
            var el2 = document.createElement('div')
            el2.style.cssText = 'color:red; transition:all 300ms; -moz-transition: all 300ms; -webkit-transition: all 300ms; -o-transition:all 300ms;'
            document.body.appendChild(el)
            document.body.appendChild(el2)
            if (avalon.modern) {
                expect(getAnimationTime(el)).toBe(2000)
                expect(getAnimationTime(el2)).toBe(300)
                document.body.removeChild(el)
                document.body.removeChild(el2)
            }
        }
    })

    it('enter action', function(done) {
        var enter = avalon.Effect.prototype.enter
        var count = 0
        var doneCalled = false
        enter.call({
            dom: document.createElement('div')
        }, {
            enter: function(el, fn) {
                ++count
                fn(false)
            },
            stagger: 100,
            onBeforeEnter: function() {
                ++count
            },
            onEnterDone: function() {
                doneCalled = true
            },
            onEnterAbort: function() {
                ++count
            }
        })
        setTimeout(function() {
            expect(count).toBe(3)
            expect(doneCalled).toBe(false)
            done()
        }, 300)

    })


    it('effect1', function(done) {

        div.innerHTML = heredoc(function() {
            /*
             <style>
             .animate-enter, .animate-leave{
             width:100px;
             height:100px;
             background: #29b6f6;
             transition: width 1s;
             -moz-transition: width 1s; 
             -webkit-transition: width 1s; 
             -o-transition: width 1s; 
             }  
             .animate-enter-active, .animate-leave{
             width:300px;
             }
             .animate-leave-active{
             width:100px;
             }
             </style>
             <div ms-controller="effect1">
             <xmp :widget="{is:'ms-test', id: 'effxx'}"></xmp>
             </div>
             */
        })

        avalon.effect("animate", {});
        avalon.component("ms-test", {
            template: '<div><p :for="el in @data" :effect="{is : \'animate\',action: el.action}"></p></div>',
            defaults: {
                //这里不会报错
                data: [{ action: 'enter' }],
                add: function() {
                    //push的时候报错
                    this.data.push({
                        action: "enter"

                    });
                }
            }
        });
        vm = avalon.define({
            $id: "effect1",
            show: function() {
                avalon.vmodels.effxx.add();
            }
        });
        avalon.scan(div)
        setTimeout(function() {
            expect(div.getElementsByTagName('p').length).toBe(1)
            vm.show()
            setTimeout(function() {
                expect(div.getElementsByTagName('p').length).toBe(2)
                done()
                setTimeout(function() {
                    delete avalon.vmodels['effxx']

                    delete avalon.component['ms-test']
                })
            }, 500)
        }, 500)
    })

    it('effect2', function(done) {
        div.innerHTML = heredoc(function() {
            /*
     <div ms-controller='effect2'>
     <div ms-visible='@aaa' class='aaa' ms-effect="{is: 'scale',action:@aaa}">111</div>
     <p ms-click='@aaa = !@aaa'>xxx</p>
      <style>
          .aaa{
              width:200px;
              height:200px;
              background: red;
          }
      </style>
      </div>
              */
        })
        avalon.effect('scale', {
            enter: function(el) {
                $(el).show(300)
            },
            leave: function(el) {
                $(el).hide(300)
            }
        })
        vm = avalon.define({
            $id: 'effect2',
            aaa: true
        })
        avalon.scan(div)
        setTimeout(function() {
            vm.aaa = false
            setTimeout(function() {
                vm.aaa = true
                setTimeout(function() {
                    delete avalon.effects.scale
                    done()
                }, 310)
            }, 310)
        }, 100)
    })
})