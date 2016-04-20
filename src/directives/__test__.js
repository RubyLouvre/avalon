var expect = require('chai').expect
var avalon = require('../core/compact').avalon
avalon.define = require('../model/compact').define

var scanNodes = require("../scan/scanNodes")


require("./compact")

var createVirtual = require("../strategy/createVirtual")


function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, "><")
}

describe('attr', function () {
    it("test", function () {
        var str = heredoc(function () {
            /*
             <body ms-controller="test">
             <div ms-attr-title="aaa">
             <b ms-attr-title="bbb">a</b>
             </div>
             <div ms-attr-title="ccc">
             <b>b</b>
             </div>
             <div ms-attr-title="ddd">
             <b ms-attr-title="eee">c</b>
             </div>
             <div>
             <b ms-attr-title="fff">d</b>
             </div>
             </body>
             */
        })
        var vm = avalon.define({
            $id: "test",
            aaa: 11,
            bbb: 22,
            ccc: 33,
            ddd: 44,
            eee: 55,
            fff: 66
        })

        //  avalon.vmodels.test = vm
        var nodes = createVirtual(str)
        scanNodes(nodes, vm)
        var body = nodes[0]
        expect(body.type).to.equal("body")
        expect(body.props).to.eql({"data-controller": "test"})
        expect(body.changeAttr).to.
                eql({'ms-controller': false, 'data-controller': 'test'})

        var firstDiv = body.children[0]
        expect(firstDiv.type).to.
                eql('div')
        expect(firstDiv.props).to.
                eql({'ms-attr-title': 'aaa', title: 11})
        expect(firstDiv.children[0].type).to.equal("b")

        expect(firstDiv.children[0].props).to.
                eql({'ms-attr-title': 'bbb', title: 22})
        expect(firstDiv.children[0].changeAttr).to.be.a("object")
        var secondDiv = body.children[1]
        expect(secondDiv.type).to.eql('div')
        expect(secondDiv.template).to.equal('<b>b</b>')


        var thirdDiv = body.children[2]
        expect(thirdDiv.type).to.eql('div')
        expect(thirdDiv.props).to.
                eql({'ms-attr-title': 'ddd', title: 44})
        expect(thirdDiv.children[0].type).to.equal("b")
        expect(thirdDiv.children[0].props).to.
                eql({'ms-attr-title': 'eee', title: 55})
        var fourthDiv = body.children[3]
        expect(fourthDiv.type).to.eql('div')

        expect(fourthDiv.children[0].type).to.eql('b')
        expect(fourthDiv.children[0].props).to.
                eql({'ms-attr-title': 'fff', title: 66})
        vm.fff = 77
        expect(fourthDiv.children[0].props).to.
                eql({'ms-attr-title': 'fff', title: 77})
        delete avalon.vmodels.test
    })


})

describe('expr', function () {
    it("test", function () {
        var str = heredoc(function () {
            /*
             <body ms-controller="test2">
             {{a}}{{b}}<div>{{a+11}}</div>{{c}}{{d}}33{{e}}
             </body>
             */
        })
        var vm = avalon.define({
            $id: "test2",
            a: 100,
            b: 22,
            c: null,
            d: void 0,
            e: NaN
        })
        var nodes = createVirtual(str)
        scanNodes(nodes, vm)
        var body = nodes[0]
        var firstChild = body.children[0]
        expect(firstChild.type).to.be.equal("#text")
        expect(firstChild.nodeValue).to.be.equal("10022")
        var div = body.children[1]
        expect(div.type).to.be.equal("div")
        expect(div.template).to.be.equal("{{a+11}}")
        expect(div.children[0].nodeValue).to.be.equal("111")
        var lastChild = body.children[2]
        expect(lastChild.type).to.be.equal("#text")
        expect(lastChild.nodeValue).to.be.equal("33NaN")
        vm.c = "999"
        expect(lastChild.nodeValue).to.be.equal("99933NaN")
        delete avalon.vmodels.test2
    })
})
describe('data', function () {
    it("test", function () {
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
             >点我</div>
             </body>
             */
        })
        var date = new Date
        var vm = avalon.define({
            $id: "test3",
            $skipArray: ["array", "object"],
            number: 111,
            number2: NaN,
            bool: false,
            bool2: true,
            nn: null,
            vv: void 0,
            array: [1, 2, 3],
            date: date,
            object: {
                name: "这是数据"
            }
        })
        var nodes = createVirtual(str)
        scanNodes(nodes, vm)
        var body = nodes[0]
        var firstChild = body.children[0]
        expect(firstChild.type).to.be.equal("div")
        expect(firstChild.changeData).to.be.a("object")
        expect(firstChild.changeData).to.be.eql({
            'data-number': '111',
            'data-bool': 'false',
            'data-null': 'null',
            'data-array': [1, 2, 3],
            'data-date': date,
            'data-object': {name: '这是数据'},
            'data-number2': 'NaN',
            'data-bool2': 'true'
        })
    })
})
describe('css', function () {
    it("test", function () {
        var str = heredoc(function () {
            /*
             <body ms-controller="test4">
             <div ms-css-width="aaa"
             ms-css-background="url({{aaa}}/{{bbb}}.jpg)"
             ms-css-color="color"
             >点我</div>
             </body>
             */
        })
        var vm = avalon.define({
            $id: "test4",
            aaa: 222,
            bbb: "xyz",
            color: "red"
        })
        var nodes = createVirtual(str)
        scanNodes(nodes, vm)
        var body = nodes[0]
        var node = body.children[0]
        expect(node.changeCss).to.be.a("object")
        expect(node.changeCss).to.be.eql({
            width: 222,
            background: 'url(222/xyz.jpg)',
            color: 'red'
        })
        vm.aaa = 333
        expect(node.changeCss).to.be.eql({
            width: 333,
            background: 'url(333/xyz.jpg)',
            color: 'red'
        })
    })
})
describe('text', function () {
    it("test", function () {
        var str = heredoc(function () {
            /*
             <body ms-controller="test5">
             <div ms-text="aaa">没有东西</div>
             <div ms-text="bbb">没有东西</div>
             <div ms-text="ccc">没有东西</div>
             </body>
             */
        })
        var vm = avalon.define({
            $id: "test5",
            aaa: '司徒正美',
            bbb: '<b>xxx</b>',
            ccc: '<p>xxx{{aaa}}yyy</p>'
        })
        var nodes = createVirtual(str)
        scanNodes(nodes, vm)
        var body = nodes[0]
        var children = body.children
        expect(children.length).to.be.equal(3)
        var first = children[0]
        expect(first.type).to.be.equal("div")
        expect(first.children[0].type).to.be.equal('#text')
        expect(first.children[0].nodeValue).to.be.equal('司徒正美')
        expect(first.children[0].skipContent).to.be.equal(true)
        var second = children[1]
        expect(second.type).to.be.equal("div")
        expect(second.children[0].type).to.be.equal('#text')
        expect(second.children[0].nodeValue).to.be.equal('<b>xxx</b>')
        expect(second.children[0].skipContent).to.be.equal(true)
        var third = children[2]
        expect(third.type).to.be.equal("div")
        expect(third.children[0].type).to.be.equal('#text')
        expect(third.children[0].nodeValue).to.be.equal('<p>xxx司徒正美yyy</p>')
        expect(third.children[0].skipContent).to.be.equal(false)
        vm.aaa = "清风炎羽"
        expect(first.children[0].nodeValue).to.be.equal('清风炎羽')
        expect(third.children[0].nodeValue).to.be.equal('<p>xxx清风炎羽yyy</p>')
    })
})


describe('html', function () {
    it("test", function () {
        var str = heredoc(function () {
            /*
             <body ms-controller="test6">
             <div ms-html="aaa">没有东西</div>
             <div ms-html="bbb">没有东西</div>
             <div ms-html="ccc">没有东西</div>
             </body>
             */
        })
        var vm = avalon.define({
            $id: "test6",
            aaa: '<s>司徒正美</s>',
            bbb: '<b>xxx</b>',
            ccc: '<p ms-html="aaa">yyyy</p>',
        })
        var nodes = createVirtual(str)
        scanNodes(nodes, vm)
        var body = nodes[0]
        var children = body.children
        expect(children.length).to.be.equal(3)
        var first = children[0]
        expect(first.type).to.be.equal("div")
        expect(first.children[0].type).to.be.equal('s')

        expect(first.children[0].toHTML()).to.be.equal('<s>司徒正美</s>')
        var second = children[1]
        expect(second.type).to.be.equal("div")
        expect(second.children[0].type).to.be.equal('b')

        expect(second.children[0].toHTML()).to.be.equal('<b>xxx</b>')

        var third = children[2]
        expect(third.type).to.be.equal("div")
        expect(third.children[0].type).to.be.equal('p')
        expect(third.children[0].toHTML()).to.be.equal('<p ms-html="aaa"><s>司徒正美</s></p>')

        vm.aaa = "<i>光明</i>"
        expect(first.children[0].type).to.be.equal('i')
        expect(first.children[0].toHTML()).to.be.equal('<i>光明</i>')
        expect(third.children[0].children[0].type).to.be.equal('i')
        expect(third.children[0].toHTML()).to.be.equal('<p ms-html="aaa"><i>光明</i></p>')
    })
})

describe('visible', function () {
    it("test", function () {
        var str = heredoc(function () {
            /*
             <div ms-controller="test7" ms-visible="aaa">没有东西</div>
             */
        })
        var vm = avalon.define({
            $id: "test7",
            aaa: 44
        })
        var nodes = createVirtual(str)
        scanNodes(nodes, vm)
        var node = nodes[0]

        expect(node.isShow).to.be.equal(44)
        vm.aaa = 1
        expect(node.isShow).to.be.equal(44)

        vm.aaa = ""
        expect(node.isShow).to.be.equal("")
        vm.aaa = 2
        expect(node.isShow).to.be.equal(2)
        vm.aaa = true
        expect(node.isShow).to.be.equal(2)
        vm.aaa = false
        expect(node.isShow).to.be.equal(false)
    })
})
describe('class', function () {
    it("test", function () {
        var str = heredoc(function () {
            /*
             <div ms-controller="test8">
             <input class="test" ms-class="aaa:toggle" >
             <input ms-class="aaa"  ms-class-1="bbb"  ms-class-2="ccc"> 
             <input ms-class-2="aaa" ms-class-4="hot {{dog}}" ms-class="bbb"  ms-class-1="ccc" >  
             <input ms-class="bbb{{dog}}"  ms-class-2="aaa"  ms-class-1="ccc"> 
             <input ms-class="xxx yyy zzz" >  
             <input ms-class="XXX yYY ZZZ:true" >  
             <input ms-class="test{{num}}" >  
             </div>
             */
        })
        var vm = avalon.define({
            $id: "test8",
            toggle: true,
            dog: "dog",
            num: 88
        })
        var nodes = createVirtual(str)
        scanNodes(nodes, vm)
        var div = nodes[0]

        expect(div.children[0].classData).to.be.eql({aaa: true})
        expect(div.children[1].classData).to.be.eql({aaa: true, bbb: true, ccc: true})
        expect(div.children[2].classData).to.be.eql({bbb: true, ccc: true, aaa: true, hot: true, dog: true})
        expect(div.children[3].classData).to.be.eql({bbbdog: true, ccc: true, aaa: true})
        expect(div.children[4].classData).to.be.eql({xxx: true, yyy: true, zzz: true})
        expect(div.children[5].classData).to.be.eql({XXX: true, yYY: true, ZZZ: true})
        expect(div.children[6].classData).to.be.eql({test88: true})


        vm.toggle = false
        vm.dog = "cat"
        vm.num = 99

        expect(div.children[0].classData).to.be.eql({aaa: false})
        expect(div.children[1].classData).to.be.eql({aaa: true, bbb: true, ccc: true})
        expect(div.children[2].classData).to.be.eql({bbb: true, ccc: true, aaa: true, hot: true, cat: true})
        expect(div.children[3].classData).to.be.eql({bbbcat: true, ccc: true, aaa: true})
        expect(div.children[4].classData).to.be.eql({xxx: true, yyy: true, zzz: true})
        expect(div.children[5].classData).to.be.eql({XXX: true, yYY: true, ZZZ: true})
        expect(div.children[6].classData).to.be.eql({test99: true})
    })
})
describe('include', function () {
    it("test", function () {
        var str = heredoc(function () {
            /*
             <div ms-controller="test9" ms-include-src='aaa'>没有东西</div>
             */
        })
        avalon.templateCache["aaa.html"] = "<b>{{eee}}</b>"
        avalon.templateCache["bbb.html"] = "<p ms-text='ddd'>没有东西</p>"
        var vm = avalon.define({
            $id: "test9",
            aaa: "aaa.html",
            eee: "司徒正美",
            ddd: "秦时明月"
        })
        var nodes = createVirtual(str)
        scanNodes(nodes, vm)
        var div = nodes[0]
        var child = div.children[0]
        expect(child.type).to.be.eql("b")
        expect(child.toHTML()).to.be.eql('<b data-include-id="aaa.html">司徒正美</b>')
        vm.aaa = "bbb.html"

        expect(div.children[0].type).to.be.eql("p")
        expect(div.children[0].toHTML()).to.be.eql('<p ms-text="ddd" data-include-id="bbb.html">秦时明月</p>')
    })
})

describe('if', function () {
    it("test", function () {
        var str = heredoc(function () {
            /*
             <div ms-controller="test10">
             <div ms-if='aaa'>{{bbb}}</div>
             </div>
             */
        })
        var vm = avalon.define({
            $id: "test10",
            aaa: true,
            bbb: "司徒正美"
        })
        var nodes = createVirtual(str)
        scanNodes(nodes, vm)
        var div = nodes[0]
        var child = div.children[0]
        expect(child.type).to.be.eql("#component")
        expect(child.__type__).to.be.eql("ms-if")
        expect(child.children[0].type).to.be.eql("div")
        expect(child.toHTML()).to.be.eql("<div>司徒正美</div>")
        vm.aaa = false
        expect(child.children[0].type).to.be.eql("#comment")
        expect(child.toHTML()).to.be.eql("<!--ms-if-->")


    })
})