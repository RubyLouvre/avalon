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
                expect(e.currentTarget.getAttribute('data-aaa')).to.equal('eee')
            },
            b: function (e, b) {
                index++
                expect(e.type).to.equal('click')
                expect(b).to.equal(111)
            }
        })
        avalon.scan(div)
        var elem = document.getElementById('a111')
        fireClick(elem)
        setTimeout(function () {
            expect(index).to.equal(3)
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
                expect(e.type).to.equal('click')
                expect(b).to.equal(33)
                e.stopPropagation()
            }
        })
        avalon.scan(div, vm)
        var elem = document.getElementById('a222')
        fireClick(elem)
        setTimeout(function () {
            expect(index).to.equal(2)
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
                expect(e.type).to.equal('click')
                expect(b).to.equal(33)
            }
        })
        avalon.scan(div, vm)
        var elem = document.getElementById('a222')
        fireClick(elem)
        setTimeout(function () {
            expect(index).to.equal(2)
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
             ms-click-1='@d'  >TEST
             
             </div>
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
            expect(str).to.equal("adcb")
            done()
        })
    })
    it('ms-for+ms-if+ms-on', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <blockquote ms-controller='on5' >
             <div ms-click='@callback' ms-for='(jj, el) in @panels' ms-if='jj === @curIndex' ms-html='el'></div>
             </blockquote>
             */
        })
        var map = [
            function (str) {
                expect(str).to.equal('面板1')
            },
            function (str) {
                expect(str).to.equal('面板2')
            },
            function (str) {
                expect(str).to.equal('面板3')
            }
        ]
        var i = 0
        vm = avalon.define({
            $id: "test",
            curIndex: 0, //默认显示第一个,
            callback: function (e) {
                map[i](e.target.innerHTML)
            },
            panels: ["面板1", "面板2", "面板3"]
        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var divs = div.getElementsByTagName('div')
            fireClick(divs[0])
            setTimeout(function () {
                i = 1
                fireClick(divs[0])
                setTimeout(function () {
                    i = 2
                    fireClick(divs[0])
                    setTimeout(function () {
                        done()
                    })
                })
            })
        })


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
                expect(i).to.equal(0)
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
                expect(i).to.equal(i)
                done()
            }, 150)
        }, 150)
    })
})

