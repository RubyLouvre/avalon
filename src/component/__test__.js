var expect = require('chai').expect

function testCase(current, version) {
    var avalon = current.avalon
    describe('avalon.each[ ' + version + ' ]', function () {
        //确保位置没有错乱
        it("test", function () {
            var array = ["aaa", "bbb", "ccc", "ddd"],
                    index = 0
            avalon.each(array, function (a, b) {
                switch (index++) {
                    case 0:
                        expect(a).to.equal(0)
                        expect(b).to.equal("aaa")
                        break;
                    case 1:
                        expect(a).to.equal(1)
                        expect(b).to.equal("bbb")
                        break;
                    case 2:
                        expect(a).to.equal(2)
                        expect(b).to.equal("ccc")
                        break;
                    case 3:
                        expect(a).to.equal(3)
                        expect(b).to.equal("ddd")
                        break;
                }
            })
            var obj = {
                xxx: 111,
                yyy: 222
            },
            k = 0
            avalon.each(obj, function (a, b) {
                switch (k++) {
                    case 0:
                        expect(a).to.equal("xxx")
                        expect(b).to.equal(111)
                        break;
                    case 1:
                        expect(a).to.equal("yyy")
                        expect(b).to.equal(222)
                        break;
                }
            })
        })
    })
    describe("isPlainObject[ " + version + " ]", function () {
        it('test', function () {
            expect(avalon.isPlainObject([])).to.equal(false)
            expect(avalon.isPlainObject(1)).to.equal(false)
            expect(avalon.isPlainObject(null)).to.equal(false)
            expect(avalon.isPlainObject(void 0)).to.equal(false)

            var fn = function () {
            }
            expect(avalon.isPlainObject(fn)).to.equal(false)
            fn.prototype = {
                someMethod: function () {
                }
            };
            expect(avalon.isPlainObject(new fn)).to.equal(false)
            expect(avalon.isPlainObject({})).to.equal(true)
            expect(avalon.isPlainObject({
                aa: "aa",
                bb: "bb",
                cc: "cc"
            })).to.equal(true)
            expect(avalon.isPlainObject(new Object)).to.equal(true)
        })
    })
    describe("isFunction[ " + version + " ]", function () {
        it('test', function () {
            expect(avalon.isFunction(avalon)).to.equal(true)
            expect(avalon.isFunction(avalon.isPlainObject)).to.equal(true)
            expect(avalon.isFunction(avalon.isWindow)).to.equal(true)
            expect(avalon.isFunction(avalon.each)).to.equal(true)
            expect(avalon.isFunction(avalon.slice)).to.equal(true)
            expect(avalon.isFunction(avalon.mix)).to.equal(true)
            expect(avalon.isFunction(String)).to.equal(true)
            expect(avalon.isFunction(Array)).to.equal(true)
            expect(avalon.isFunction(Object)).to.equal(true)
            expect(avalon.isFunction(Function)).to.equal(true)


        })
    })
    describe("avalon.slice[ " + version + " ]", function () {
        it('test', function () {
            var a = [1, 2, 3, 4, 5, 6, 7]
            expect(avalon.slice(a, 0)).to.eql(a.slice(0))
            expect(avalon.slice(a, 1, 4)).to.eql(a.slice(1, 4))
            expect(avalon.slice(a, -1)).to.eql(a.slice(-1))
            expect(avalon.slice(a, 1, -2)).to.eql(a.slice(1, -2))
            expect(avalon.slice(a, 1, NaN)).to.eql(a.slice(1, NaN))
            expect(avalon.slice(a, 1, 2.1)).to.eql(a.slice(1, 2.1))
            expect(avalon.slice(a, 1.1, 4)).to.eql(a.slice(1.1, 4))
            expect(avalon.slice(a, 1.2, NaN)).to.eql(a.slice(1, NaN))
            expect(avalon.slice(a, NaN)).to.eql(a.slice(NaN))
            expect(avalon.slice(a, 1.3, 3.1)).to.eql(a.slice(1.3, 3.1))
            expect(avalon.slice(a, 2, "XXX")).to.eql(a.slice(2, "XXX"))
            expect(avalon.slice(a, -2)).to.eql(a.slice(-2))
            expect(avalon.slice(a, 1, 9)).to.eql(a.slice(1, 9))
            expect(avalon.slice(a, 20, -21)).to.eql(a.slice(20, -21))
            expect(avalon.slice(a, -1, null)).to.eql(a.slice(-1, null))
        })
    })
    describe("isArrayLike[ " + version + " ]", function () {
        var isArrayLike = current.isArrayLike
        it('test', function () {
            //函数,正则,元素,节点,文档,window等对象为非
            expect(isArrayLike(function () {
            })).to.equal(false);
            expect(isArrayLike("string")).to.equal(false)
            expect(isArrayLike(/test/)).to.equal(false)
            expect(isArrayLike(global)).to.equal(false)
            expect(isArrayLike(true)).to.equal(false)
            expect(isArrayLike(avalon.noop)).to.equal(false)
            expect(isArrayLike(100)).to.equal(false)
            expect(isArrayLike(arguments)).to.equal(true)

            // 自定义对象必须有length, 并且为非负正数
            expect(isArrayLike({
                0: "a",
                1: "b",
                length: 2
            })).to.equal(true)
        })
    })
    describe("avalon.mix[ " + version + " ]", function () {
        it("test", function () {
            var settings = {"xnumber1": 5, "xnumber2": 7, "xstring1": "peter", "xstring2": "pan"},
            options = {"xnumber2": 1, "xstring2": "x", "xxx": "newstring"},
            optionsCopy = {"xnumber2": 1, "xstring2": "x", "xxx": "newstring"},
            merged = {"xnumber1": 5, "xnumber2": 1, "xstring1": "peter", "xstring2": "x", "xxx": "newstring"}
            avalon.mix(settings, options)
            expect(settings).to.eql(merged)
            expect(options).to.eql(optionsCopy)
            avalon.mix(settings, null, options)
            expect(settings).to.eql(merged)
            expect(options).to.eql(optionsCopy)
            var Doc = function () {
            }
            var document = new Doc(),
                    deep1 = {"foo": {"bar": true}},
            deep2 = {"foo": {"baz": true}, "foo2": document},
            deep2copy = {"foo": {"baz": true}, "foo2": document},
            deepmerged = {"foo": {"bar": true, "baz": true}, "foo2": document}
            avalon.mix(true, deep1, deep2)
            expect(deep1[ "foo" ]).to.eql(deepmerged[ "foo" ])
            expect(deep2[ "foo" ]).to.eql(deep2copy[ "foo" ])
            expect(deep1[ "foo2" ]).to.equal(document)
//https://github.com/jquery/jquery/blob/master/test/unit/core.js#L1101
        })
    })

}
testCase(require("./compact"), "compact")

testCase(require("./modern"), "modern")



