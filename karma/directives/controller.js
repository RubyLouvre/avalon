var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
describe('controller', function () {
    var body = document.body, div = document.createElement('div'),
        h1, h2, h3, cdiv

    div.innerHTML = heredoc(function () {
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
        $id  : 'root',
        page : 'root',
        level: 'root',
    });
    var first = avalon.define({
        $id : 'first',
        page: 'first',
        kind: 'first',
    });
    var second = avalon.define({
        $id  : 'second',
        page : 'second',
        grade: "second",
    });

    avalon.scan(div)
    it('default', function (done) {
        setTimeout(function() {
            h1 = div.getElementsByTagName('h1')[0]
            h2 = div.getElementsByTagName('h2')[0]
            h3 = div.getElementsByTagName('h3')[0]
            cdiv = document.getElementById('cdiv')
            
            expect(h1.innerHTML).to.equal(root.page)
            expect(h2.innerHTML).to.equal(first.page)
            expect(h3.innerHTML).to.equal(second.page)
            expect(cdiv.innerHTML).to.equal([root.level, second.page, first.kind].join('-'))

            done()
        })
    })

    it('change', function (done) {
        first.page = 'A'
        setTimeout(function() {
            h1 = div.getElementsByTagName('h1')[0]
            h2 = div.getElementsByTagName('h2')[0]
            h3 = div.getElementsByTagName('h3')[0]
            cdiv = document.getElementById('cdiv')
            
            expect(h1.innerHTML).to.equal(root.page)
            expect(h2.innerHTML).to.equal(first.page)
            expect(!!h3).to.equal(false)
            expect(!!cdiv).to.equal(false)

            done()
        })
    })

    it('changeBack', function (done) {
        first.page = 'first'
        second.page = 'B'
        setTimeout(function() {
            h1 = div.getElementsByTagName('h1')[0]
            h2 = div.getElementsByTagName('h2')[0]
            h3 = div.getElementsByTagName('h3')[0]
            cdiv = document.getElementById('cdiv')
            
            expect(h1.innerHTML).to.equal(root.page)
            expect(h2.innerHTML).to.equal(first.page)
            expect(h3.innerHTML).to.equal(second.page)
            expect(!!cdiv).to.equal(false)
            setTimeout(function(){
                div.innerHTML = ""
                delete avalon.vmodels.first
                delete avalon.vmodels.second
                done()
            })
           
        })
    })
})