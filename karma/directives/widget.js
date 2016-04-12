var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
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

    it('lifecycle', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='widget1' >
             <div><wbr ms-widget="[{is:'ms-button'},@config]"/></div>
             </div>
             */
        })
        var index = 0
        vm = avalon.define({
            $id: 'widget1',
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
        avalon.scan(div)
        setTimeout(function () {
            expect(index).to.equal(2)
            vm.config.buttonText = 'change'
            setTimeout(function () {
                div.innerHTML = ""
                setTimeout(function () {
                    expect(index).to.equal(4)
                    done()
                })
            })
        })
    })

    it('通过更新配置对象修改组件界面', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='widget2' >
             <xmp ms-widget="[{is:'ms-panel'}, @aaa]" style='border:1px solid red;display:block'>{{@panelBody}}</xmp>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget2',
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
    }, 100)

    it('确保都被扫描', function () {
        div.innerHTML = heredoc(function () {
            /*
             <form ms-controller='widget3'>
             <div ms-attr="{title:@option.text}">{{@option.text}}</div>
             <ms-section ms-widget="@option"></ms-section>
             </form>
             */
        })
        vm = avalon.define({
            $id: 'widget3',
            option: {
                text: 'test'
            }
        });

        avalon.component('ms-section', {
            template: '<ms-section><blockquote ms-attr="{title:@text}">{{@text}}</blockquote></ms-section>',
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
    })

})