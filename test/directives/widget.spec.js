import { avalon } from '../../src/seed/core'
import '../../src/component/index'

avalon.component('ms-button', {
    template: '<button type="button"><span><slot /></span></button>',
    defaults: {
        buttonText: "button"
    },
    soleSlot: 'buttonText'
})
avalon.component('ms-panel', {
    template: heredoc(function() {
        /*
<div>
    <div class="body">
        <slot name="body"></slot>
    </div>
    <p><ms-button :widget="@button" /></p>
</div>
         */
    }),
    defaults: {
        body: "&nbsp;&nbsp;",
        button: {
            buttonText: 'click me!'
        }
    },
    soleSlot: 'body'
})

function getDiv(el) {
    if (el.querySelector) {
        return el.querySelector('.body')
    } else {
        var els = el.getElementsByTagName('div')
        for (var i = 0, l = els.length; i < l; i++) {
            if (els[i].className === 'body') {
                return els[i]
            }
        }
    }
}
describe('widget', function() {

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
    it('ms-button中buttonText', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='widget0' >
             <xmp is='ms-button'>{{@btn}}</xmp>
             <ms-button>这是标签里面的TEXT</ms-button>
             <ms-button ms-widget='{buttonText:"这是属性中的TEXT"}'></ms-button>
             <ms-button></ms-button>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget0',
            btn: '这是VM中的TEXT'
        })
        avalon.scan(div)
        setTimeout(function() {

            var span = div.getElementsByTagName('span')
            expect(span[0][textProp]).toBe('这是VM中的TEXT')
            expect(span[1][textProp]).toBe('这是标签里面的TEXT')
            expect(span[2][textProp]).toBe('这是属性中的TEXT')
            expect(span[3][textProp]).toBe('button')
            vm.btn = '改动'
            setTimeout(function() {
                expect(span[0][textProp]).toBe('改动')

                done()
            })
        })


    })

    it('通过更新配置对象修改组件界面(VM对象形式)', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='widget1' >
             <xmp is='ms-panel' ms-widget="@aaa" style='border:1px solid red;display:block'>{{@aaa.panelBody}}</xmp>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget1',
            aaa: {
                panelBody: 'aaa面板',
                button: {
                    buttonText: "aaa按钮"
                }
            }
        })
        avalon.scan(div)


        setTimeout(function() {
            var div2 = getDiv(div)
            var span = div.getElementsByTagName('span')[0]
            expect(div2[textProp]).toBe('aaa面板')
            expect(span[textProp]).toBe('aaa按钮')
            vm.aaa.panelBody = '新面板'
            vm.aaa.button.buttonText = "新按钮"
            setTimeout(function() {
                expect(div2[textProp]).toBe('新面板')
                expect(span[textProp]).toBe('新按钮')
                vm.aaa.panelBody = '新面板plus'
                vm.aaa.button.buttonText = "新按钮plus"
                setTimeout(function() {

                    expect(div2[textProp]).toBe('新面板plus')
                    expect(span[textProp]).toBe('新按钮plus')
                    done()
                }, 300)
            }, 300)
        }, 300)
    })

    it('通过更新配置对象修改组件界面(数组形式)', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='widget1' >
             <xmp ms-widget="[{is:'ms-panel'}, @aaa]" style='border:1px solid red;display:block'>{{@aaa.panelBody}}</xmp>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget1',
            aaa: {
                panelBody: 'aaa面板',
                button: {
                    buttonText: "aaa按钮"
                }
            }
        })
        avalon.scan(div)


        setTimeout(function() {
            var div2 = getDiv(div)
            var span = div.getElementsByTagName('span')[0]
            expect(div2[textProp]).toBe('aaa面板')
            expect(span[textProp]).toBe('aaa按钮')
            vm.aaa.panelBody = '新面板'
            vm.aaa.button.buttonText = "新按钮"
            setTimeout(function() {
                expect(div2[textProp]).toBe('新面板')
                expect(span[textProp]).toBe('新按钮')
                vm.aaa.panelBody = '新面板plus'
                vm.aaa.button.buttonText = "新按钮plus"
                setTimeout(function() {

                    expect(div2[textProp]).toBe('新面板plus')
                    expect(span[textProp]).toBe('新按钮plus')
                    done()
                }, 300)
            }, 300)
        }, 300)
    })


    it('通过更新配置对象修改组件界面(字面量形式)', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='widget1' >
             <xmp is='ms-panel' ms-widget="{body: @aaa.panelBody, button: @aaa.button }" style='border:1px solid red;display:block'></xmp>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget1',
            aaa: {
                panelBody: 'aaa面板',
                button: {
                    buttonText: "aaa按钮"
                }
            }
        })
        avalon.scan(div)


        setTimeout(function() {
            var div2 = getDiv(div)
            var span = div.getElementsByTagName('span')[0]
            expect(div2[textProp]).toBe('aaa面板')
            expect(span[textProp]).toBe('aaa按钮')
            vm.aaa.panelBody = '新面板'
            vm.aaa.button.buttonText = "新按钮"
            setTimeout(function() {
                expect(div2[textProp]).toBe('新面板')
                expect(span[textProp]).toBe('新按钮')
                vm.aaa.panelBody = '新面板plus'
                vm.aaa.button.buttonText = "新按钮plus"
                setTimeout(function() {

                    expect(div2[textProp]).toBe('新面板plus')
                    expect(span[textProp]).toBe('新按钮plus')
                    done()
                }, 300)
            }, 300)
        }, 300)
    })

    it('确保都被扫描', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <form ms-controller='widget2'>
             <div ms-attr="{title:@option.text}">{{@option.text}}</div>
             <ms-section ms-widget="@option"></ms-section>
             </form>
             */
        })
        vm = avalon.define({
            $id: 'widget2',
            option: {
                text: 'test'
            }
        });

        avalon.component('ms-section', {
            template: '<section><blockquote ms-attr="{title:@text}">{{@text}}</blockquote></section>',
            defaults: {
                text: 'default'
            }
        })
        avalon.scan(div)
        setTimeout(function() {
            var div1 = div.getElementsByTagName('div')
            expect(div1[0].innerHTML).toBe('test')
            var blockquote1 = div.getElementsByTagName('blockquote')
            expect(blockquote1[0].innerHTML).toBe('test')
            expect(blockquote1[0].title).toBe('test')
            vm.option.text = 999
            setTimeout(function() {
                expect(div1[0].innerHTML).toBe('999')
                expect(blockquote1[0].innerHTML).toBe('999')
                expect(blockquote1[0].title).toBe('999')
                done()
            })
        })
    });
    it('确保生命周期钩子都生效,其onViewChange回调会在config被修复也触发', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <form ms-controller='widget3'>
             <wbr ms-widget="[{is:'ms-dialog',id:'aaa'},@config]" />
             </form>
             */
        })
        var hookIndex = 0
        avalon.component('ms-dialog', {
            template: '<div class="dialog"><p><slot name="content"/></p></div>',
            defaults: {
                content: "内容",
                onInit: function(a) {
                    hookIndex++
                    expect(a.type).toBe('init')
                },
                onReady: function(a) {
                    hookIndex++
                    expect(a.type).toBe('ready')
                },
                onViewChange: function(a) {
                    hookIndex++
                    expect(a.type).toBe('viewchange')
                },
                onDispose: function(a) {
                    hookIndex++
                    expect(a.type).toBe('dispose')
                }
            },
            soleSlot: 'content'
        })
        vm = avalon.define({
            $id: 'widget3',
            config: {
                content: '弹窗1'
            }
        })
        avalon.scan(div, vm)
        setTimeout(function() {
            var divs = div.getElementsByTagName('div')
            var successRender = false
            for (var i = 0, el; el = divs[i++];) {
                if (el.nodeType === 1 && el.className === 'dialog') {
                    successRender = true
                    break
                }
            }
            expect(successRender).toBe(true)
            var hasText = div.innerHTML.indexOf('弹窗1') > 0
            expect(hasText).toBe(true)
            vm.config.content = '弹窗2'
            setTimeout(function() {
                var hasText = div.innerHTML.indexOf('弹窗2') > 0
                expect(hasText).toBe(true)
                vm.$render.dispose()
                    //div.innerHTML = ''

                setTimeout(function() {
                    expect(hookIndex).toBe(4)
                    done()
                }, 120)
            }, 120)

        })

    });

    it('lifecycle', function(done) {

        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='widget4' >
             <div><wbr ms-widget="[{is:'ms-button'},@config]"/></div>
             </div>
             */
        })
        var index = 0
        vm = avalon.define({
            $id: 'widget4',
            config: {
                buttonText: '按钮',
                onInit: function(e) {
                    expect(e.type).toBe('init')
                        ++index
                },
                onReady: function(e) {
                    expect(e.type).toBe('ready')
                        ++index
                },
                onViewChange: function(e) {
                    expect(e.type).toBe('viewchange')
                        ++index
                },
                onDispose: function(e) {
                    expect(e.type).toBe('dispose')
                        ++index
                }
            }
        })
        avalon.scan(div)
        setTimeout(function() {
            expect(index + "!").toBe(2 + "!")

            vm.config.buttonText = 'change'
            setTimeout(function() {
                vm.$render.dispose()
                div.innerHTML = ""
                setTimeout(function() {
                    expect(index).toBe(4)
                    done()
                }, 120)
            }, 120)
        }, 120)
    })

    it('操作组件vm来更新组件的界面', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="widget5">
             <xmp ms-widget='{is:"ms-pager"}'></xmp>
             {{@bb}}
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget5',
            bb: '其他内容'
        });
        avalon.component('ms-pager', {
            template: '<div><strong>{{@totalPages}}</strong><button ms-click="@xx" type="button">++</button></div>',
            defaults: {
                totalPages: 21,
                xx: function() {
                    this.totalPages += 1;
                }
            }
        })
        avalon.scan(div)
        setTimeout(function() {
            var button = div.getElementsByTagName('button')[0]
            var strong = div.getElementsByTagName('strong')[0]
            expect(strong.innerHTML).toBe('21')
            fireClick(button)
            expect(strong.innerHTML).toBe('22')
            fireClick(button)
            expect(strong.innerHTML).toBe('23')
            fireClick(button)
            expect(strong.innerHTML).toBe('24')
            done()
        })

    })

    it('使用顶层VM的子对象作配置对象', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='widget6' >
             <wbr ms-widget="@config"/>
             </div>
             */
        })
        var vm = avalon.define({
            $id: 'widget6',
            config: {
                is: 'ms-button',
                buttonText: '按钮',
                onInit: function(a) {
                    console.log("onInit!!")
                },
                onReady: function(a) {
                    console.log("onReady!!")
                },
                onViewChange: function() {
                    console.log("onViewChange!!")
                },
                onDispose: function() {
                    console.log("onDispose!!")
                }
            }
        })
        avalon.scan(div, vm)
        setTimeout(function() {
            vm.config.buttonText = 'change'
            setTimeout(function() {
                var s = div.getElementsByTagName('span')[0]
                expect(s[textProp]).toBe('change')
                done()
            }, 100)
        }, 150)

    })

    it('组件的最外层元素定义其他指令不生效的BUG', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="widget7" id="widget7"><wbr ms-widget="[{is : 'Test'},@$config]"></div>
             */
        })
        avalon.component("Test", {
            template: '<Test ms-attr="{title:@aaa}">{{##bbb}}</test>',
            defaults: {
                bbb: "TEST",
                aaa: 'title'
            }
        })
        vm = avalon.define({
            $id: "widget7",
            $config: {}
        })
        avalon.scan(div)
        setTimeout(function() {
            var widget = div.getElementsByTagName('test')[0]
            expect(widget.nodeName.toLowerCase()).toBe('test')
            expect(widget.title).toBe('title')
            expect(widget.innerHTML).toBe('TEST')
            delete avalon.components['Test']
            done()

        }, 150)

    })

    it('&nbsp;的解析问题', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="widget8">
             <xmp cached='true' ms-widget="{is:'ms-time',id:'d234234'}"></xmp>
             </div>             
             */
        })
        avalon.component('ms-time', {
            template: "<kbd ms-click='@click'>{{@aaa}}&nbsp;</kbd>",
            defaults: {
                aaa: 123
            }
        });
        vm = avalon.define({
            $id: "widget8"
        })
        avalon.scan(div)
        setTimeout(function() {
            var span = div.getElementsByTagName('kbd')[0]
            expect(span.firstChild.nodeValue.trim()).toBe('123')
            delete avalon.components['ms-time']

            done()

        }, 250)

    })

    it('应该ms-widget没有cached,并且出现不规范的ms-if的情况', function(done) {
        //https://github.com/RubyLouvre/avalon/issues/1584
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="widget9"><wbr ms-widget="[{is:'ms-pagination2', id:'xxx_'}, @configPagination]"/></div>
             */
        })
        vm = avalon.define({
            $id: 'widget9',
            configPagination: {
                totalPages: 0
            },
            clickPage1: function() {
                vm.configPagination.totalPages = 0

            },
            clickPage2: function() {
                vm.configPagination.totalPages = 12
            }
        })
        var paginationTemplate = heredoc(function() {
            /*
             <nav ms-if="@_isShow">
             {{@totalPages}}
             </nav>
             */
        });
        avalon.component('ms-pagination2', {
            template: paginationTemplate,
            defaults: {
                totalPages: 1,
                _isShow: true,
                isShowPagination: true,
                onInit: function(e) {
                    var vm = e.vmodel;
                    vm._showPaginations();
                    this.$watch('totalPages', function(a) {
                        setTimeout(function() {
                            vm._showPaginations()
                        }, 2)
                    })
                },
                _showPaginations: function() {
                    var vm = this;
                    return vm._isShow = vm.totalPages > 0 && vm.isShowPagination
                }
            }
        })
        avalon.scan(div)
        setTimeout(function() {
            expect(div.getElementsByTagName('nav').length).toBe(0)
            vm.clickPage2()
            setTimeout(function() {
                expect(div.getElementsByTagName('nav').length).toBe(1)
                vm.clickPage1()
                setTimeout(function() {
                    expect(div.getElementsByTagName('nav').length).toBe(0)

                    delete avalon.components['ms-pagination2']
                    delete avalon.vmodels.xxx_
                    done()
                }, 150)
            }, 150)
        }, 150)

    })


    it('组件没有cached的情况不断切换里面的事件还能生效', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="widget10" ms-html="@tpl"></div>
             */
        })
        var v123 = heredoc(function() {
            /*
             <div ms-controller="widget10_1">
             <p ms-click="@alert">123</p>
             <wbr ms-widget="{is:'ms-remove',ddd: @ddd}"/>
             </div>
             */
        })
        var v456 = heredoc(function() {
            /*
             <div ms-controller="widget10_2">
             <p ms-click="@alert">456</p>
             <wbr ms-widget="{is:'ms-remove',ddd: @ddd}"/>
             </div>
             */
        })
        var clickIndex = 0
        avalon.component('ms-remove', {
            template: "<span ms-click='@click'>{{@ddd}}</span>",
            defaults: {
                ddd: '3333',
                click: function() {
                    ++clickIndex
                }
            }
        });
        vm = avalon.define({
            $id: 'widget10',
            tpl: v123,
            switch1: function() {
                vm.tpl = v123
            },
            switch2: function() {
                vm.tpl = v456
            }
        })
        avalon.define({
            $id: 'widget10_1',
            ddd: 'aaaa',
            alert: function() {
                avalon.log('????')
            }
        });

        avalon.define({
            $id: 'widget10_2',
            ddd: 'bbbb',
            alert: function() {
                avalon.log('!!!!')
            }
        });
        avalon.scan(div)
        setTimeout(function() {
            var spans = div.getElementsByTagName('span')
            expect(spans.length).toBe(1)
            expect(spans[0].innerHTML).toBe('aaaa')
            vm.switch2()
            setTimeout(function() {
                var spans = div.getElementsByTagName('span')
                expect(spans.length).toBe(1)
                expect(spans[0].innerHTML).toBe('bbbb')
                vm.switch1()
                setTimeout(function() {
                    var spans = div.getElementsByTagName('span')
                    expect(spans.length).toBe(1)
                    expect(spans[0].innerHTML).toBe('aaaa')
                    fireClick(spans[0])
                    setTimeout(function() {
                        expect(clickIndex).toBe(1)
                        delete avalon.components['ms-remove']

                        delete avalon.vmodels['widget10_1']
                        delete avalon.vmodels['widget10_2']
                        done()
                    }, 20)
                }, 100)
            }, 100)
        }, 150)

    })

    it('skipContent导致组件渲染异常', function(done) {

        div.innerHTML = heredoc(function() {
            /*
             <div :controller="widget11">
             <xmp :widget='{is:"CoursePlanCard", id:"CoursePlanCard"}'></xmp>
             </div>
             */
        })
        avalon.component("CoursePlanCard", {
            template: heredoc(function() {
                /*
                 <div class="CoursePlanCard" >
                 <div class="CoursePlanCard-info">
                 <p class="CoursePlanCard-tip" id='aass'>
                 <span>计划类型:</span>{{''}}</p>
                 <p class="CoursePlanCard-tip">
                 <span>计划时间:</span>{{''}}</p>  
                 <p class="CoursePlanCard-tip">
                 <span>必修学分:</span>{{''}}</p>
                 <p class="CoursePlanCard-tip">
                 <span>选修学分:</span>{{''}}</p>
                 </div>
                 </div>
                 */
            }),
            defaults: {
                onInit: function(a) {}
            }
        })

        vm = avalon.define({
            $id: "widget11"
        })
        avalon.scan(div)
        setTimeout(function() {
            expect(div.getElementsByTagName('span').length).toBe(4)
            delete avalon.components['CoursePlanCard']

            delete avalon.vmodels['widget11']
            delete avalon.vmodels['CoursePlanCard']
            done()
        }, 150)

    })
    it('移动多个同名的slot元素到组件内部', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div :controller="widget12">
             <xmp :widget='{is:"Slots"}'>
            <p slot='aaa' >1111</p>
            <p slot='aaa' >2222</p>
            <p slot='bbb' >3333</p>
            <p slot='bbb' >4444</p>
             </xmp>
             </div>
             */
        })
        avalon.component("Slots", {
            template: heredoc(function() {
                /*
                 <div class="slots" >
                 <div>
                  <slot name='aaa'/>
                 </div>
                  <div>
                  <slot name='bbb'/>
                 </div>
                 </div>
                 */
            }),
            defaults: {

            }
        })

        vm = avalon.define({
            $id: "widget12",
            arr: [1, 2, 3]
        })
        avalon.scan(div)
        setTimeout(function() {
            expect(div.getElementsByTagName('p').length).toBe(4)

            delete avalon.components.Slots
            done()
        }, 150)

    })
    it('slot+ms-for', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div :controller="widget12">
             <xmp :widget='{is:"Slots"}'>
                <p slot='aaa' ms-for="el in @arr">{{el}}</p>
             </xmp>
             </div>
             */
        })
        avalon.component("Slots", {
            template: heredoc(function() {
                /*
                 <div class="slots" >
                 <div>
                  <slot name='aaa'/>
                 </div>
                 </div>
                 */
            }),
            defaults: {

            }
        })

        vm = avalon.define({
            $id: "widget12",
            arr: [111, 222, 333]
        })
        avalon.scan(div)
        setTimeout(function() {
            expect(div.getElementsByTagName('p').length).toBe(3)

            delete avalon.components.Slots
            done()
        }, 150)

    })
    it('cached', function(done) {
        div.innerHTML = heredoc(function() {
            /*
           <div ms-controller="widget13">
           <div ms-if="@aaa">
              <ms-button cached='true' ms-widget="{buttonText:Math.random(),id:'ddd' }"></ms-button>
           </div>
           </div>
             */
        })
        vm = avalon.define({
            $id: 'widget13',
            aaa: true
        })
        avalon.scan(div)
        var button = div.getElementsByTagName('button')[0]
        var text = button[textProp]
        button.setAttribute('title', 'vvvv')
        vm.aaa = false
        setTimeout(function() {
            vm.aaa = true
            setTimeout(function() {
                button = div.getElementsByTagName('button')[0]
                expect(button[textProp]).toBe(text)
                expect(button.getAttribute('title')).toBe('vvvv')
                done()
            }, 100)
        }, 100)

    })

    it('路由组件', function(done) {
        avalon.component('ms-hasha', {
            template: '<div>{{@num}}<input type="text" ms-duplex-number="@num"/><button type="button" ms-on-click="@onPlus">+++</button></div>',
            defaults: {
                num: 1,
                onPlus: function() {
                    this.num++;
                }
            }
        });
        var tpl = '<div><h4>{{@title}}</h4><button type="button" ms-on-click="@onChangeTitle">点击改变title</button></div>';
        var time = 10
        avalon.component('ms-hashb', {
            template: tpl,
            defaults: {
                title: "这是标题",
                random: 0,
                onChangeTitle: function(e) {
                    this.title = 'title' + (++time);
                }
            }
        });
        vm = avalon.define({
            $id: 'router',
            panel: '',
            hash: ''
        })

        function changePanel(v) {
            vm.panel = '<' + v + ' cached="true" ms-widget="{id:\'' + v + '\'}"></' + v + '>'
        }
        vm.$watch('hash', changePanel)
        vm.hash = 'ms-hasha'

        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="router" ms-html="@panel">xxx</div>
             */
        })
        avalon.scan(div)
        setTimeout(function() {
            var input = div.getElementsByTagName('input')[0]
            var button = div.getElementsByTagName('button')[0]

            expect(input.value).toBe('1')
            fireClick(button)
            expect(input.value).toBe('2')
            fireClick(button)
            expect(input.value).toBe('3')
            fireClick(button)
            expect(input.value).toBe('4')
            vm.hash = 'ms-hashb'
            setTimeout(function() {
                var h4 = div.getElementsByTagName('h4')[0]
                var button = div.getElementsByTagName('button')[0]
                expect(h4.innerHTML).toBe('这是标题')
                fireClick(button)
                expect(h4.innerHTML).toBe('title11')
                fireClick(button)
                expect(h4.innerHTML).toBe('title12')
                fireClick(button)
                expect(h4.innerHTML).toBe('title13')
                vm.hash = 'ms-hasha'
                setTimeout(function() {
                    var input = div.getElementsByTagName('input')[0]
                    var button = div.getElementsByTagName('button')[0]

                    expect(input.value).toBe('4')
                    fireClick(button)
                    expect(input.value).toBe('5')
                    fireClick(button)
                    expect(input.value).toBe('6')
                    fireClick(button)
                    expect(input.value).toBe('7')
                    done()
                })
            })

        })

    })
    it('延迟初始化组件', function(done) {
        if (avalon.msie < 9) {
            div.innerHTML = heredoc(function() {
                /*
                <div ms-controller="widget14" style="behavior: url(#default#VML)" ><v:ms-kkk/></div>
                */
            })
        } else {
            div.innerHTML = heredoc(function() {
                /*
                <div ms-controller="widget14" ><ms-kkk /></div>
                */
            })
        }
        console.log(div.innerHTML, '延迟初始化')
        vm = avalon.define({
            $id: 'widget14'
        })
        avalon.scan(div)
        setTimeout(function() {
            expect(div.innerHTML).toMatch(/unresolved/)
            avalon.component('ms-kkk', {
                template: '<div>good</div>',
                defaults: {}
            })
            setTimeout(function() {
                expect(div.innerHTML).toMatch(/good/)
                done()
                delete avalon.components['ms-kkk']
            }, 100)
        }, 100)
    })

    it('object slot', function(done) {
        div.innerHTML = heredoc(function() {
            /*
<div ms-controller="widget15">
    <ms-myview>
        <div slot="header">aaa</div>
        <div slot="body">bbb</div>
    </ms-myview>
</div>
            */
        })
        avalon.component('ms-myview', {
            template: '<div type="button">\
                <slot name="header" />\
                <slot name="body" />\
                </div>',
            defaults: {
                buttonText: ""
            }
        })
        vm = avalon.define({
            $id: 'widget15'
        });
        avalon.scan(div)
        setTimeout(function() {
            expect(div[textProp].replace(/[\r\n\s]+/g, '')).toBe('aaabbb')
            done()
            delete avalon.components['ms-myview']
        }, 100)
    })

    it('onViewChange', function(done) {
        var onViewChangeCount = 0
        avalon.component('ms-select', {
            template: heredoc(function() {
                /*
                 <div>
                 <select ms-duplex="@num">
                 <option ms-for="el in @numList">{{el}}</option>
                 </select>
                 <p>{{@num}}</p>
                 </div>
                 */
            }),
            defaults: {
                numList: [6, 12, 18, 24, 30],
                num: 12,
                onInit: function() {
                    console.log('onInit')
                },
                onReady: function() {
                    console.log('onReady')
                },
                onViewChange: function(e) {
                    ++onViewChangeCount
                }
            }
        })
        div.innerHTML = heredoc(function() {
            /*
            <div ms-controller="widget16" ><ms-select :widget="{num: @aaa}" /></div>
            */
        })
        vm = avalon.define({
            $id: 'widget16',
            aaa: 6
        })
        avalon.scan(div)
        setTimeout(function() {
            var p = div.getElementsByTagName('p')[0]
            expect(p.innerHTML).toBe('6')
            vm.aaa = 12
            setTimeout(function() {
                expect(p.innerHTML).toBe('12')
                vm.aaa = 18
                setTimeout(function() {
                    expect(p.innerHTML).toBe('18')
                    setTimeout(function() {
                        expect(onViewChangeCount).toBe(2)
                        delete avalon.components['ms-select']
                        done()
                    }, 100)

                }, 100)
            }, 100)
        }, 300)

    })

    it('根节点出现ms-if=false', function(done) {
        div.innerHTML = heredoc(function() {
            /*
        <div ms-controller='widget17'>
          <wbr is="ms-iff1" ms-widget='{aaa: 111, toggle: true}'/>
          <wbr is="ms-iff1" ms-widget='{aaa: 222, toggle: false}'/>
        </div>
              */
        })

        avalon.component('ms-iff1', {
            template: '<p ms-if="@toggle" ms-text="@aaa"></p>',
            defaults: {
                toggle: true,
                aaa: 333
            }
        })
        vm = avalon.define({
            $id: 'widget17'
        })
        avalon.scan(div, vm)
        setTimeout(function() {
            expect(div[textProp]).toBe('111')
            done()
        }, 100)

    })
    it('avalon2.2.2 组件只传递数组多次更新只有第一次可以更新到组件', function(done) {
        //https://github.com/RubyLouvre/avalon/issues/1856
        div.innerHTML = heredoc(function() {
            /*
        <div ms-controller='widget18'>
          <xmp ms-widget="{is:'vip-test', id:'vip',data:@data}"></xmp>
        </div>
              */
        })

        avalon.component('vip-test', {
            template: '<p><span ms-for="(index,value) in @data">{{value}}|</span></p>',
            defaults: {
                data: [],
                obj: {}
            }
        })
        vm = avalon.define({
            $id: 'widget18',
            data: []
        })
        avalon.scan(div, vm)
        setTimeout(function() {
            vm.data = [1, 2, 3, 4, 5, 6]
            setTimeout(function() {
                vm.data.pushArray([7, 8])
                setTimeout(function() {
                    vm.data.pushArray([100, 200])
                    expect(div[textProp]).toBe('1|2|3|4|5|6|7|8|100|200|')
                    delete avalon.components['vip-test']
                    done()
                }, 100)
            }, 100)
        }, 100)

    })

    it('处理数组', function(done) {
        avalon.component("ms-pager2", {
            template: heredoc(function() {
                /*
                 <div class="pagination">
                 <ul>
                 <li :for="el in @pages" 
                 :class="[ el == @currentPage && 'active' ]">
                 <a href="javascript:void(0)" :click="@gotoPage(el, $event)">{{el}}</a>
                 </li>
                 </ul>
                 </div>
                 */
            }),
            defaults: {
                totalPage: 25,
                currentPage: 1,
                showPage: 5,
                pages: [1, 2, 3, 4, 5],
                gotoPage: function(page, e) {
                    this.currentPage = page;
                    this.pages = this.getPages();
                },
                getPages: function() {
                    var pages = [];
                    var s = this.showPage,
                        l = this.currentPage,
                        r = this.currentPage,
                        c = this.totalPage;
                    pages.push(l);
                    while (true) {
                        if (pages.length >= s) {
                            break;
                        }
                        if (l > 1) {
                            pages.unshift(--l);
                        }
                        if (pages.length >= s) {
                            break;
                        }
                        if (r < c) {
                            pages.push(++r);
                        }
                    }

                    return pages;
                }
            }
        });
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="widget19">
             <wbr is="ms-pager2" />
            <style>
    .pagination ul{
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .pagination li{
        float: left;
    }
    .pagination li a{
        text-decoration: none;
        display: inline-block;
        width:40px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        background: #fafafa;
        color:#000;

    }
    .pagination .active a{
        background: #009a61;
        color:#fff;
    }
            </style>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget19'
        })
        avalon.scan(div)
        setTimeout(function() {
            var ul = div.getElementsByTagName('ul')[0]
            expect(ul[textProp]).toBe('12345')
            var lis = ul.getElementsByTagName('a')
            fireClick(lis[3])
            setTimeout(function() {
                expect(ul[textProp]).toBe('23456')
                fireClick(lis[3])
                setTimeout(function() {
                    expect(ul[textProp]).toBe('34567')
                    fireClick(lis[0])
                    setTimeout(function() {
                        expect(ul[textProp]).toBe('12345')
                        delete avalon.components['ms-pager2']
                        done()
                    }, 120)
                }, 120)
            }, 120)
        }, 100)
    })
    //有空加上这个测试 https://github.com/RubyLouvre/avalon/issues/1862
  it("修正selected同步BUG", function(done){
      div.innerHTML = heredoc(function(){
          /*
    <div ms-controller="widget20">
        <div class="panel panel-default ms-controller" >
            <xmp ms-widget="{is:'ms-pager3'}"></xmp>
        </div>

    </div>
          */
      })
      avalon.component('ms-pager3', {
            template: heredoc(function(){
                /*
                <select ms-duplex="@countPerPage">
                <option role="option" value="5">5</option>     
               <option role="option" value="10">10</option>
               <option role="option" value="20">20</option></select>
                 */
            }),
            defaults: {
                countPerPage: 10
            }
        });
         vm = avalon.define({
            $id: 'widget20'
        })
        avalon.scan(div, vm)
        setTimeout(function(){
           var op = div.getElementsByTagName('option')
           expect(op[1].selected).toBe(true)
           delete avalon.components['ms-pager3']
           done()
        })
   })
    it("组件继承功能", function(done){
         var aaa = avalon.component('aaa', {
            defaults: {
                aaa:11,
                bbb:22
            },
            template: '<strong>{{@aaa}}</strong>'
        })
        var bbb = aaa.extend({
            displayName:'bbb',
            template: '<em><strong>{{@aaa}}</strong></em>'
        })
        var ccc = aaa.extend({
            displayName:'ccc'
        })
        div.innerHTML = heredoc(function(){
            /*
             <div ms-controller='widget21'>
             <wbr is='aaa' /><wbr is='bbb' /><wbr is='ccc' />
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget21'
        })
        avalon.scan(div, vm)
        setTimeout(function(){
            expect(div.getElementsByTagName('strong').length).toBe(3)
            expect(div.getElementsByTagName('em').length).toBe(1)
            delete avalon.components.aaa
            delete avalon.components.bbb
            delete avalon.components.ccc
            done()
        },100)
        
        
    })
})