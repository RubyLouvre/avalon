var expect = require('chai').expect
var avalon = require("../avalon")
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').replace(/\*\/[^\/]+$/, '')
}
describe('strategy', function () {
    describe('lexer', function () {

        it("div", function () {
            var nodes = avalon.lexer("<div>aaa</div>")
            expect(nodes.length).to.equal(1)
            var div = nodes[0]
            expect(div.nodeName).to.equal("div")
            expect(div.template).to.equal("aaa")
            expect(div.props).to.eql({})
            expect(div.children).to.eql([])
        })
        it("br", function () {
            var nodes = avalon.lexer("<br title=aaa/>")

            expect(nodes.length).to.equal(1)
            var div = nodes[0]
            expect(div.nodeName).to.equal("br")
            expect(div.template).to.equal("")
            expect(div.isVoidTag).to.equal(true)

            expect(div.props).to.eql({title: "aaa"})
            expect(div.children).to.eql([])
        })
        it("多个div", function () {
            var nodes = avalon.lexer("<div>111</div><div>222</div><div>333</div>")

            expect(nodes.length).to.equal(3)

            expect(nodes[0].nodeName).to.equal("div")
            expect(nodes[1].nodeName).to.equal("div")
            expect(nodes[2].nodeName).to.equal("div")
        })
        it("多个div,div套div", function () {
            var str = "<div><div>01</div><div>02</div></div><div>222</div><div>333</div>"
            var nodes = avalon.lexer(str)
            expect(nodes.length).to.equal(3)
            expect(nodes[0].nodeName).to.equal("div")
            expect(nodes[0].template).to.equal("<div>01</div><div>02</div>")
            expect(nodes[1].nodeName).to.equal("div")
            expect(nodes[2].nodeName).to.equal("div")
        })
        it("多个div,div套div2", function () {
            var str = "<div><div><div></div><div></div></div><div>02</div></div><div>222</div><div>333</div>"
            var nodes = avalon.lexer(str)
            expect(nodes.length).to.equal(3)
            expect(nodes[0].nodeName).to.equal("div")
            expect(nodes[0].template).to.equal("<div><div></div><div></div></div><div>02</div>")
            expect(nodes[1].nodeName).to.equal("div")
            expect(nodes[2].nodeName).to.equal("div")
        })
        it("多个div,div套div3", function () {
            var str = "<div id='<div></div><div></div>'><div><div></div><div></div></div><div>02</div></div><div>222</div>"
            var nodes = avalon.lexer(str)
            expect(nodes.length).to.equal(2)
            expect(nodes[0].nodeName).to.equal("div")
            expect(nodes[0].props.id).to.equal('<div></div><div></div>')
            expect(nodes[0].template).to.equal("<div><div></div><div></div></div><div>02</div>")
            expect(nodes[1].nodeName).to.equal("div")

        })
        it("ms-repeat", function () {
            var str = "<hr/><ul ms-controller=aa><li ms-repeat=array>{{el}}</li></ul>"
            var nodes = avalon.lexer(str)
            expect(nodes.length).to.equal(2)
            expect(nodes[0].nodeName).to.equal("hr")
            expect(nodes[1].nodeName).to.equal("ul")
            var li = nodes[1].children[0]
            expect(li.nodeName).to.equal("li")
            expect(li.template).to.equal("{{el}}")
        })
        it("voidTag", function () {
            var str = "<br><hr><img><input><link><meta><area><base><col><command><embed><keygen><param><source><track><wbr>"
            var nodes = avalon.lexer(str)
            var types = ["br", "hr", "img", "input", "link", "meta", "area", "base",
                "col", "command", "embed", "keygen", "param", "source", "track", "wbr"
            ]
            for (var i = 0, el; el = nodes[i]; i++) {
                expect(el.nodeName).to.equal(types[i])
            }
        })
        it("comment", function () {
            var str = "<!--<br><div></div>-->xxx<div>yyy</div><!--aaa-->"
            var nodes = avalon.lexer(str)
            expect(nodes.length).to.equal(4)
            expect(nodes[0].nodeName).to.equal("#comment")
            expect(nodes[1].nodeName).to.equal("#text")
            expect(nodes[2].nodeName).to.equal("div")
            expect(nodes[3].nodeName).to.equal("#comment")
        })
        it('tbody', function () {
            var str = heredoc(function () {
                /*<table>
                 <thead>
                 <tr><td>{{a}}</td></tr>
                 </thead>
                 <tfoot><tr><td>{{a}}</td></tr></tfoot>
                 <tr><td>{{a}}</td></tr>
                 <tr><td>{{b}}</td></tr>
                 <tr><td>{{c}}</td></tr>
                 <tfoot><tr><td>{{a}}</td></tr></tfoot>
                 <tr><td>{{a}}</td></tr>
                 <tr><td>{{b}}</td></tr>
                 <tr><td>{{c}}</td></tr>
                 </table>
                 */
            })
            var nodes = avalon.lexer(str)
            expect(nodes[0].nodeName).to.equal("table")
            var children = nodes[0].children
            expect(children[0].nodeName).to.equal("#text")
            expect(children[1].nodeName).to.equal("thead")
            expect(children[2].nodeName).to.equal("#text")
            expect(children[3].nodeName).to.equal("tfoot")
            expect(children[4].nodeName).to.equal("#text")
            expect(children[5].nodeName).to.equal("tbody")
            expect(children[6].nodeName).to.equal("tfoot")
            expect(children[7].nodeName).to.equal("#text")
            expect(children[8].nodeName).to.equal("tbody")
            var c = children[5].children
            expect(c.length).to.equal(6)

            expect(c[0].nodeName).to.equal("tr")
            expect(c[1].nodeName).to.equal("#text")
            expect(c[2].nodeName).to.equal("tr")
            expect(c[3].nodeName).to.equal("#text")
            expect(c[4].nodeName).to.equal("tr")
            expect(c[5].nodeName).to.equal("#text")
        })


        it("先处理闭标签再处理开标签,否则解决不了下面的标签", function () {

            var str = heredoc(function () {
                /*
                 <body ms-controller="test3">
                 <div ms-data-number="number"
                 ms-data-number2="number2"
                 ms-data-bool="bool"
                 ms-data-bool2="bool2"
                 ms-data-void="vv"
                 ms-data-null="nn"
                 ms-data-array="array"
                 ms-data-date="date"
                 ms-data-object="object"
                 ms-data-fn="show"
                 >点我</div>999
                 </body>
                 */
            }).trim()
            var nodes = avalon.lexer(str)
            expect(nodes[0].nodeName).to.equal("body")
            var c = nodes[0].children
            expect(c[0].nodeName).to.equal("#text")
            expect(c[1].nodeName).to.equal("div")
            expect(c[2].nodeName).to.equal("#text")

        })


    })
})
