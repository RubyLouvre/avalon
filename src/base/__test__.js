var expect = require('chai').expect
var builtin = require("./builtin")
describe('makeHashCode', function () {
    var fn = builtin.makeHashCode
   
    it("test", function () {
        expect(/aaa\d+/.test(fn("aaa"))).to.be.ok;
    })
})
describe('serialize', function () {
    var a = builtin.serialize
    it("test", function () {
        expect(a.call("")).to.equal("[object String]")
        expect(a.call([])).to.equal("[object Array]")
        expect(a.call(1)).to.equal("[object Number]")
        expect(a.call(new Date())).to.equal("[object Date]")
        expect(a.call(/test/)).to.equal("[object RegExp]")
    })
})
describe('markID', function () {
    it("test", function () {
        var listenerID = builtin.markID({})
        expect(/e\d+/.test(listenerID)).to.be.ok
    })
})
describe('type', function () {
    var fn = builtin.type
    it("test", function () {

        expect(fn(/e\d+/)).to.equal("regexp")
        expect(fn('sss')).to.equal("string")
        expect(fn(111)).to.equal("number")
        expect(fn(new Error)).to.equal("error")
        expect(fn(Date)).to.equal("function")
        expect(fn(new Date)).to.equal("date")
        expect(fn({})).to.equal("object")
        expect(fn(null)).to.equal("null")
        expect(fn(void 0)).to.equal("undefined")
    })
})
describe('oneObject', function () {
    var fn = builtin.oneObject
    it("test", function () {
        expect(fn("aa,bb,cc")).to.eql({
            "aa": 1,
            "bb": 1,
            "cc": 1
        })
        expect(fn([1, 2, 3], false)).to.eql({
            "1": false,
            "2": false,
            "3": false
        })
    })
})

describe('rmsAttr', function () {
    var reg = builtin.rmsAttr
    it("test", function () {
        expect("ms-aaa".match(reg).slice(1, 3)).to.eql(["aaa", ""])
        expect("ms-repeat-item".match(reg).slice(1, 3)).to.eql(
                ["repeat", "item"]
                )
    })
})

describe('hyphen', function () {
    var fn = builtin.hyphen
    it("test", function () {
        expect(fn("aaBB")).to.equal("aa-bb")

    })
})



