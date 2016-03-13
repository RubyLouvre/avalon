var expect = require('chai').expect
var avalon = require("../avalon")
describe('strategy', function () {
    describe('lexer', function () {

        it("div", function () {
            var nodes = avalon.lexer("<div>aaa</div>")
            expect(nodes.length).to.equal(1)
            var div = nodes[0]
            expect(div.type).to.equal("div")
            expect(div.template).to.equal("aaa")
            expect(div.props).to.eql({})
            expect(div.children).to.eql([])
        })
        it("br", function () {
            var nodes = avalon.lexer("<br title=aaa/>")

            expect(nodes.length).to.equal(1)
            var div = nodes[0]
            expect(div.type).to.equal("br")
            expect(div.template).to.equal("")
            expect(div.isVoidTag).to.equal(true)

            expect(div.props).to.eql({title: "aaa"})
            expect(div.children).to.eql([])
        })
        it("多个div", function () {
            var nodes = avalon.lexer("<div>111</div><div>222</div><div>333</div>")

            expect(nodes.length).to.equal(3)

            expect(nodes[0].type).to.equal("div")
            expect(nodes[1].type).to.equal("div")
            expect(nodes[2].type).to.equal("div")
        })
        it("多个div,div套div", function () {
            var str = "<div><div>01</div><div>02</div></div><div>222</div><div>333</div>"
            var nodes = avalon.lexer(str)
            expect(nodes.length).to.equal(3)
            expect(nodes[0].type).to.equal("div")
            expect(nodes[0].template).to.equal("<div>01</div><div>02</div>")
            expect(nodes[1].type).to.equal("div")
            expect(nodes[2].type).to.equal("div")
        })
        it("多个div,div套div2", function () {
            var str = "<div><div><div></div><div></div></div><div>02</div></div><div>222</div><div>333</div>"
            var nodes = avalon.lexer(str)
            expect(nodes.length).to.equal(3)
            expect(nodes[0].type).to.equal("div")
            expect(nodes[0].template).to.equal("<div><div></div><div></div></div><div>02</div>")
            expect(nodes[1].type).to.equal("div")
            expect(nodes[2].type).to.equal("div")
        })
        it("多个div,div套div3", function () {
            var str = "<div id='<div></div><div></div>'><div><div></div><div></div></div><div>02</div></div><div>222</div>"
            var nodes = avalon.lexer(str)
            expect(nodes.length).to.equal(2)
            expect(nodes[0].type).to.equal("div")
            expect(nodes[0].props.id).to.equal('<div></div><div></div>')
            expect(nodes[0].template).to.equal("<div><div></div><div></div></div><div>02</div>")
            expect(nodes[1].type).to.equal("div")

        })
        it("ms-repeat", function () {
            var str = "<hr/><ul ms-controller=aa><li ms-repeat=array>{{el}}</li></ul>"
            var nodes = avalon.lexer(str)
            expect(nodes.length).to.equal(2)
            expect(nodes[0].type).to.equal("hr")
            expect(nodes[1].type).to.equal("ul")
            var li = nodes[1].children[0]
            expect(li.type).to.equal("li")
            expect(li.template).to.equal("{{el}}")
        })
        it("voidTag", function () {
            var str = "<br><hr><img><input><link><meta><area><base><col><command><embed><keygen><param><source><track><wbr>"
            var nodes = avalon.lexer(str)
            var types = ["br", "hr", "img", "input", "link", "meta", "area", "base",
                "col", "command", "embed", "keygen", "param", "source", "track", "wbr"
            ]
            for (var i = 0, el; el = nodes[i]; i++) {
                expect(el.type).to.equal(types[i])
            }
        })
        it("comment", function () {
            var str = "<!--<br><div></div>-->xxx<div>yyy</div><!--aaa-->"
            var nodes = avalon.lexer(str)
            expect(nodes.length).to.equal(4)
            expect(nodes[0].type).to.equal("#comment")
            expect(nodes[1].type).to.equal("#text")
            expect(nodes[2].type).to.equal("div")
            expect(nodes[3].type).to.equal("#comment")
        })

        it("先处理闭标签再处理开标签,否则解决不了下面的标签", function () {
            function heredoc(fn) {
                return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').replace(/\*\/[^\/]+$/, '')
            }
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
            expect(nodes[0].type).to.equal("body")
            var c = nodes[0].children
            expect(c[0].type).to.equal("#text")
            expect(c[1].type).to.equal("div")
            expect(c[2].type).to.equal("#text")

        })


    })
})
