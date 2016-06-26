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

describe('widget', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })


    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it('inline-block', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='widget0' >
             <xmp ms-widget="{is:'ms-button'}">{{@btn}}</xmp>
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
        setTimeout(function () {
            var span = div.getElementsByTagName('span')
            expect(span[0].innerHTML).to.equal('这是VM中的TEXT')
            expect(span[1].innerHTML).to.equal('这是标签里面的TEXT')
            expect(span[2].innerHTML).to.equal('这是属性中的TEXT')
            expect(span[3].innerHTML).to.equal('button')
            vm.btn = '改动'
            setTimeout(function () {
                expect(span[0].innerHTML).to.equal('改动')

                done()
            })
        })


    })



    it('通过更新配置对象修改组件界面', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='widget1' >
             <xmp ms-widget="[{is:'ms-panel'}, @aaa]" style='border:1px solid red;display:block'>{{@panelBody}}</xmp>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget1',
            panelBody: '这是面板的内容',
            aaa: {
                ms_button: {
                    buttonText: "vm中的值"
                }
            }
        })
        avalon.scan(div)
        function getDiv(el) {
            if (el.querySelector) {
                return el.querySelector('.body')
            } else {
                return el.getElementsByTagName('div')[0].
                        getElementsByTagName('div')[0]
            }
        }
        setTimeout(function () {
            var div2 = getDiv(div)
            var span = div.getElementsByTagName('span')[0]
            expect(div2.innerHTML).to.equal('这是面板的内容')
            expect(span.innerHTML).to.equal('vm中的值')
            vm.panelBody = '新面板'
            vm.aaa.ms_button.buttonText = "新按钮"
            setTimeout(function () {
                expect(div2.innerHTML).to.equal('新面板')
                expect(span.innerHTML).to.equal('新按钮')
                vm.panelBody = '新面板plus'
                vm.aaa.ms_button.buttonText = "新按钮plus"
                setTimeout(function () {

                    expect(div2.innerHTML).to.equal('新面板plus')
                    expect(span.innerHTML).to.equal('新按钮plus')
                    done()
                }, 300)
            }, 300)
        }, 300)
    })

    it('确保都被扫描', function (done) {
        div.innerHTML = heredoc(function () {
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
        avalon.scan(div, vm)
        setTimeout(function () {
            var div1 = div.getElementsByTagName('div')
            expect(div1[0].innerHTML).to.equal('test')
            var blockquote1 = div.getElementsByTagName('blockquote')
            expect(blockquote1[0].innerHTML).to.equal('test')
            expect(blockquote1[0].title).to.equal('test')
            vm.option.text = 999
            setTimeout(function () {
                expect(div1[0].innerHTML).to.equal('999')
                expect(blockquote1[0].innerHTML).to.equal('999')
                expect(blockquote1[0].title).to.equal('999')
                done()
            })
        })
    });

    it('确保生命周期钩子都生效,其onViewChange回调会在config被修复也触发', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <form ms-controller='widget3'>
             <wbr ms-widget="[{is:'ms-dialog',$id:'aaa'},@config]" />
             </form>
             */
        })
        var hookIndex = 0
        avalon.component('ms-dialog', {
            template: '<div class="dialog"><p><slot name="content"></p></div>',
            defaults: {
                buttonText: "内容",
                onInit: function (a) {
                    hookIndex++
                    expect(a.type).to.be.equal('init')
                },
                onReady: function (a) {
                    hookIndex++
                    expect(a.type).to.be.equal('ready')
                },
                onViewChange: function (a) {
                    hookIndex++
                    expect(a.type).to.be.equal('viewchange')
                },
                onDispose: function (a) {
                    hookIndex++
                    expect(a.type).to.be.equal('dispose')
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
        setTimeout(function () {
            var divs = div.getElementsByTagName('div')
            var successRender = false
            for (var i = 0, el; el = divs[i++]; ) {
                if (el.nodeType === 1 && el.className === 'dialog') {
                    successRender = true
                    break
                }
            }
            expect(successRender).to.be.equal(true)
            var hasText = div.innerHTML.indexOf('弹窗1') > 0
            expect(hasText).to.be.equal(true)
            vm.config.content = '弹窗2'
            setTimeout(function () {
                var hasText = div.innerHTML.indexOf('弹窗2') > 0
                expect(hasText).to.be.equal(true)
                div.innerHTML = ''
                setTimeout(function () {
                    expect(hookIndex).to.be.equal(4)
                    done()
                }, 120)
            }, 120)

        })

    });
    it('lifecycle', function (done) {
        var testDiv = document.createElement('div')
        document.body.appendChild(testDiv)
        testDiv.innerHTML = heredoc(function () {
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
                onInit: function (e) {
                    expect(e.type).to.equal('init')
                    ++index
                },
                onReady: function (e) {
                    expect(e.type).to.equal('ready')
                    ++index
                },
                onViewChange: function (e) {
                    expect(e.type).to.equal('viewchange')
                    ++index
                },
                onDispose: function (e) {
                    expect(e.type).to.equal('dispose')
                    ++index
                }
            }
        })
        avalon.scan(testDiv)
        setTimeout(function () {
            expect(index + "!").to.equal(2 + "!")

            vm.config.buttonText = 'change'
            setTimeout(function () {
                testDiv.innerHTML = ""
                setTimeout(function () {
                    expect(index).to.equal(4)
                    document.body.removeChild(testDiv)
                    done()
                }, 120)
            }, 120)
        }, 120)
    })
    it('操作组件vm来更新组件的界面', function (done) {
        div.innerHTML = heredoc(function () {
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
                xx: function () {
                    this.totalPages += 1;
                }
            }
        })
        avalon.scan(div)
        setTimeout(function () {
            var button = div.getElementsByTagName('button')[0]
            var strong = div.getElementsByTagName('strong')[0]
            expect(strong.innerHTML).to.be.equal('21')
            fireClick(button)
            expect(strong.innerHTML).to.be.equal('22')
            fireClick(button)
            expect(strong.innerHTML).to.be.equal('23')
            fireClick(button)
            expect(strong.innerHTML).to.be.equal('24')
            done()
        })

    })
    it('路由组件', function (done) {
        avalon.component('ms-hasha', {
            template: '<div cached="true">{{@num}}<input type="text" ms-duplex-number="@num"/><button type="button" ms-on-click="@onPlus">+++</button></div>',
            defaults: {
                num: 1,
                onPlus: function () {
                    this.num++;
                }
            }
        });
        var tpl = '<div cached="true"><h4>{{@title}}</h4><button type="button" ms-on-click="@onChangeTitle">点击改变title</button></div>';
        var time = 10
        avalon.component('ms-hashb', {
            template: tpl,
            defaults: {
                title: "这是标题",
                random: 0,
                onChangeTitle: function (e) {
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
            vm.panel = '<' + v + ' ms-widget=\"{$id:"' + v + '"}\"></' + v + '>'
        }
        vm.$watch('hash', changePanel)
        vm.hash = 'ms-hasha'

        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="router" ms-html="@panel">xxx</div>
             */
        })
        avalon.scan(div)
        setTimeout(function () {
            var input = div.getElementsByTagName('input')[0]
            var button = div.getElementsByTagName('button')[0]

            expect(input.value).to.be.equal('1')
            fireClick(button)
            expect(input.value).to.be.equal('2')
            fireClick(button)
            expect(input.value).to.be.equal('3')
            fireClick(button)
            expect(input.value).to.be.equal('4')
            vm.hash = 'ms-hashb'
            setTimeout(function () {
                var h4 = div.getElementsByTagName('h4')[0]
                var button = div.getElementsByTagName('button')[0]
                expect(h4.innerHTML).to.be.equal('这是标题')
                fireClick(button)
                expect(h4.innerHTML).to.be.equal('title11')
                fireClick(button)
                expect(h4.innerHTML).to.be.equal('title12')
                fireClick(button)
                expect(h4.innerHTML).to.be.equal('title13')
                vm.hash = 'ms-hasha'
                setTimeout(function () {
                    var input = div.getElementsByTagName('input')[0]
                    var button = div.getElementsByTagName('button')[0]

                    expect(input.value).to.be.equal('4')
                    fireClick(button)
                    expect(input.value).to.be.equal('5')
                    fireClick(button)
                    expect(input.value).to.be.equal('6')
                    fireClick(button)
                    expect(input.value).to.be.equal('7')
                    done()
                })
            })

        })

    })

    it('使用顶层VM的子对象作配置对象', function (done) {
        div.innerHTML = heredoc(function () {
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
                onInit: function (a) {
                    console.log("onInit!!")
                },
                onReady: function (a) {
                    console.log("onReady!!")
                },
                onViewChange: function () {
                    console.log("onViewChange!!")
                },
                onDispose: function () {
                    console.log("onDispose!!")
                }
            }
        })
        avalon.scan(div, vm)
        setTimeout(function () {
            vm.config.buttonText = 'change'
            setTimeout(function () {
                var s = div.getElementsByTagName('span')[0]
                expect(s.innerHTML).to.equal('change')
                done()
            }, 100)
        }, 150)

    })
    
    it('组件的最外层元素定义其他指令不生效的BUG', function (done) {
        div.innerHTML = heredoc(function () {
            /*
              <div ms-controller="widget7"><wbr ms-widget="[{is : 'test'},@$config]"></div>
             */
        })
        avalon.component("test",{
            template : "<test ms-attr=\"{title:@aaa}\">{{##bbb}}</test>",
            defaults : {
              bbb: "TEST",
              aaa: 'title'
            }
        })
        vm = avalon.define({
            $id : "widget7",
            $config : { }
        })
        avalon.scan(div)
        setTimeout(function () {
            var widget = div.firstChild.firstChild
            expect(widget.nodeName.toLowerCase()).to.equal('test')
            expect(widget.title).to.equal('title')
            expect(widget.innerHTML).to.equal('TEST')
            done()
           
        }, 150)

    })

})