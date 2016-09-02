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
        var prop = 'textContent' in div ? 'textContent' : 'innerText'
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
        var prop = 'textContent' in div ? 'textContent' : 'innerText'
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
            bbb: 111,
            aaa: '<b id="color">{{@bbb}}</b><script>window.kkk20160630= 20<\/script><style>#color{color:red}</style>'
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
            vm.tpl = heredoc(function () {
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

    it('ms-html遇到ms-if应用节点对齐算法BUG', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="html5" ms-html="@tpl"></div>
             */
        })
         var html = heredoc(function () {
            /*
             <blockquote ms-controller="html52">
             <span ms-if='@show'>AAA</span>|<span ms-for='el in @ter'>{{el}}</span>
             </blockquote>
             */
        })
        vm = avalon.define({
            $id: 'html5',
            tpl: ""
        });
        avalon.define({
            $id: 'html52',
            ter: ['呵呵哒1', '呵呵哒2', '呵呵哒3'],
            show: false
        });
        avalon.scan(div)
        setTimeout(function () {
            vm.tpl = html
            expect(div.getElementsByTagName('span').length).to.equal(3)
            vm.tpl = ''
            setTimeout(function () {
                expect(div.getElementsByTagName('span').length).to.equal(0)
                vm.tpl = html
                setTimeout(function () {
                    expect(div.getElementsByTagName('span').length).to.equal(3)
                    done()
                    delete avalon.scopes['html41']
                    delete avalon.scopes['html51']
                    delete avalon.scopes['html51']
                    delete avalon.scopes['html52']
                }, 150)
            }, 150)

        }, 150)
    })

    it('ms-html遇到XMP', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="html6" ms-html="@tpl"></div>
             */
        })

        vm = avalon.define({
            $id: 'html6',
            tpl: ""
        });

        avalon.scan(div)
        setTimeout(function () {
            vm.tpl = '<xmp><input /></xmp>'
            expect(div.getElementsByTagName('input').length).to.equal(0)
            done()
        }, 300)
    })
    it('双重循环+ms-html', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="html7">
             <div ms-for="page in @pages">
             <div ms-for="(index,el) in page">
             <div ms-html="@tpl[el.type]"></div>
             </div>
             </div>
             </div>
             */
        })
        vm = avalon.define({
            $id: "html7",
            tpl: {
                'img': '<p ms-text="el.val"></p>',
                'text': '<p ms-text="el.val"></p>'
            },
            pages: [
                [{type: 'img', val: 'img'}, {type: 'text', val: 'text'}]
            ],
            btn: function () {
                vm.pages[0].push({type: 'img', val: 'push'})
                vm.pages[0].push({type: 'text', val: 'push2'})
            }
        })
        avalon.scan(div)
        expect(div.getElementsByTagName('p').length).to.equal(2)
        setTimeout(function () {
            vm.btn()
            expect(div.getElementsByTagName('p').length).to.equal(4)
            done()

        }, 300)
    })
    it('svg', function () {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="html8">
             <div ms-html="@svg1" style="width:100px;height:100px;position:absolute"></div>
             <div ms-html="@svg2" style="width:100px;height:100px;position:absolute;top:200px"></div>
             </div>
             */
        })
        vm = avalon.define({
            $id: "html8",
            svg1: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none meet" style="position: absolute; width: 100%; height: 100%;" viewBox="0 0 200 200"><g><g transform="scale(0.1953125, 0.1953125)"><path d="M512 512m-505.429418 0a10 10 0 1 0 1010.858835 0 10 10 0 1 0-1010.858835 0Z" fill="#eb4f38"></path></g></g></svg>',
            svg2: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="none meet" style="position: absolute; width: 100%; height: 100%;" viewBox="0 0 200 200"><g><g transform="scale(0.1953125, 0.1953125)"><path d="M512 512m-505.429418 0a10 10 0 1 0 1010.858835 0 10 10 0 1 0-1010.858835 0Z" fill="#eb4f38"></path></g></g></svg>'
        })
        avalon.scan(div)
        expect(div.getElementsByTagName('svg').length).to.equal(2)
        delete avalon.scopes.html8
        delete avalon.vmodels.html8
    })
    
    it('ms-html遇到br', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="html9">
             <br ms-html="@aaa" />
             </div>
             */
        })
        vm = avalon.define({
            $id: "html9",
            aaa: '<i>222</i>'
        })
        avalon.scan(div)
        expect(div.getElementsByTagName('i').length).to.equal(0)
        delete avalon.scopes.html9
        delete avalon.vmodels.html9
        done()
    })
})
