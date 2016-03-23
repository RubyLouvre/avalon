var assert = chai.assert;
var expect = chai.expect
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, "><")
}
function fireClick(el) {
    if (el.click) {
        el.click()
    } else {
//https://developer.mozilla.org/samples/domref/dispatchEvent.html
        var evt = document.createEvent("MouseEvents")
        evt.initMouseEvent("click", true, true, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
        !el.dispatchEvent(evt);
    }
}
describe('repeat', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement("div")
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it("ms-class+ms-repeat", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="repeat0">
             <ul>
             <li ms-repeat="array" ms-class="{{el}}">{{el}}-{{$first}}-{{$last}}-{{$index}}</li>
             </ul>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'repeat0',
            array: [1, 2, 3, 4]
        })
        avalon.scan(div, vm)
        var lis = div.getElementsByTagName("li")
        expect(lis.length).to.equal(4)
        expect(lis[0].innerHTML).to.equal("1-true-false-0")
        expect(lis[1].innerHTML).to.equal("2-false-false-1")
        expect(lis[2].innerHTML).to.equal("3-false-false-2")
        expect(lis[3].innerHTML).to.equal("4-false-true-3")
        expect(lis[0].className).to.equal("1")
        expect(lis[1].className).to.equal("2")
        expect(lis[2].className).to.equal("3")
        expect(lis[3].className).to.equal("4")
        vm.array.push(5)
        setTimeout(function () {

            lis = div.getElementsByTagName("li")
            expect(lis.length).to.equal(5)
            expect(lis[3].innerHTML).to.equal("4-false-false-3")
            expect(lis[4].innerHTML).to.equal("5-false-true-4")
            vm.array.reverse()
            setTimeout(function () {
                expect(lis[0].innerHTML).to.equal("5-true-false-0")
                expect(lis[1].innerHTML).to.equal("4-false-false-1")
                expect(lis[2].innerHTML).to.equal("3-false-false-2")
                expect(lis[3].innerHTML).to.equal("2-false-false-3")
                expect(lis[4].innerHTML).to.equal("1-false-true-4")
                vm.array.shift()
                vm.array.unshift("a")
                vm.array.pop()
                vm.array.remove(3)
                setTimeout(function () {
                    expect(lis[0].innerHTML).to.equal("a-true-false-0")
                    expect(lis[1].innerHTML).to.equal("4-false-false-1")
                    expect(lis[2].innerHTML).to.equal("2-false-true-2")
                    done()
                }, 100)
            }, 100)
        }, 100)


    })
    it("ms-each", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="repeat1">
             <select multiple="true" ms-each="array">
             <option>{{el.a}}</option>
             </select>
             <p ms-repeat="array">{{el.a+222}}</p>
             
             </div>
             */
        })
        vm = avalon.define({
            $id: 'repeat1',
            array: [{a: 11}, {a: 22}, {a: 33}]
        })
        avalon.scan(div, vm)
        var options = div.getElementsByTagName("option")
        expect(options[0].text).to.equal("11")
        expect(options[1].text).to.equal("22")
        expect(options[2].text).to.equal("33")
        avalon.each(options, function (i, el) {
            el.title = el.text
        })
        var ps = div.getElementsByTagName("p")
        var prop = "textContent" in div ? "textContent" : "innerText"
        expect(ps[0][prop]).to.equal("233")
        expect(ps[1][prop]).to.equal("244")
        expect(ps[2][prop]).to.equal("255")
        avalon.each(ps, function (i, el) {
            el.title = el[prop]
        })
        vm.array.reverse()
        setTimeout(function () {
            expect(options[0].text + "!").to.equal("33!")
            expect(options[1].text).to.equal("22")
            expect(options[2].text).to.equal("11")
            expect(options[0].title).to.equal("33")
            expect(options[1].title).to.equal("22")
            expect(options[2].title).to.equal("11")
            expect(ps[0][prop]).to.equal("255")
            expect(ps[1][prop]).to.equal("244")
            expect(ps[2][prop]).to.equal("233")
            expect(ps[0].title).to.equal("255")
            expect(ps[1].title).to.equal("244")
            expect(ps[2].title).to.equal("233")
            vm.array = [{a: 66}, {a: 77}, {a: 88}, {a: 99}]
            setTimeout(function () {
                expect(options[0].text).to.equal("66")
                expect(options[1].text).to.equal("77")
                expect(options[2].text).to.equal("88")
                expect(options[3].text).to.equal("99")
                expect(options[0].title).to.equal("33")
                expect(options[1].title).to.equal("22")
                expect(options[2].title).to.equal("11")
                expect(options[3].title).to.equal("")


                expect(ps[0][prop]).to.equal("288")
                expect(ps[1][prop]).to.equal("299")
                expect(ps[2][prop]).to.equal("310")
                expect(ps[3][prop]).to.equal("321")
                expect(ps[0].title).to.equal("255")
                expect(ps[1].title).to.equal("244")
                expect(ps[2].title).to.equal("233")
                expect(ps[3].title).to.equal("")
                done()
            })
        })

    })
    it("test3", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <table ms-controller="repeat2">
             <tr ms-repeat-db="databases">
             <td class="dbname">
             {{db.dbname}}
             </td>
             <!-- Sample -->
             <td class="query-count">
             <span ms-class="{{db.lastSample.className}}">
             {{db.lastSample.queries.length}}
             </span>
             <b ms-repeat='q in db.lastSample.queries' ms-class="{{q}}">{{q}}</b>
             </td>
             
             </tr>
             */
        })
        vm = avalon.define({
            $id: "repeat2",
            databases: []
        })
        avalon.scan(div, vm)
        var trs = div.getElementsByTagName("tr")
        var tds = div.getElementsByTagName("td")
        var bs = div.getElementsByTagName("b")
        expect(trs.length).to.equal(0)

        vm.databases = [{
                dbname: "xxx",
                lastSample: {
                    className: "aa bb cc",
                    queries: ["aa", "bb", "cc"]
                }
            }, {
                dbname: "yyy",
                lastSample: {
                    className: "aa bb cc",
                    queries: ["xx", "yy", "zz", 'dd']
                }
            }]
        setTimeout(function () {
            expect(trs.length).to.equal(2)
            expect(tds[0].innerHTML).to.equal("xxx")
            var spans = div.getElementsByTagName("span")
            expect(spans[0].innerHTML).to.equal("3")
            expect(spans[1].innerHTML).to.equal("4")
            expect(bs[0].innerHTML).to.equal("aa")
            expect(bs[1].innerHTML).to.equal("bb")
            expect(bs[2].innerHTML).to.equal("cc")
            expect(bs[3].innerHTML).to.equal("xx")
            expect(bs[4].innerHTML).to.equal("yy")
            expect(bs[5].innerHTML).to.equal("zz")
            expect(bs[6].innerHTML).to.equal("dd")
            expect(bs[0].className).to.equal("aa")
            expect(bs[1].className).to.equal("bb")
            expect(bs[2].className).to.equal("cc")
            expect(bs[3].className).to.equal("xx")
            expect(bs[4].className).to.equal("yy")
            expect(bs[5].className).to.equal("zz")
            expect(bs[6].className).to.equal("dd")

            done()
        })

    })

  
    it("object single repeat", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <ul ms-controller="repeat4">
             <li ms-repeat="object">
             {{$key}}||{{$val}}||{{$index}}
             </li>
             </ul>
             */
        })
        vm = avalon.define({
            $id: "repeat4",
            object: {
                aaa: 111,
                bbb: 222,
                ccc: 333
            }
        })
        avalon.scan(div, vm)
        var lis = div.getElementsByTagName("li")
        expect(lis.length).to.equal(3)
        expect(lis[0].innerHTML.trim()).to.equal("aaa||111||0")
        expect(lis[1].innerHTML.trim()).to.equal("bbb||222||1")
        expect(lis[2].innerHTML.trim()).to.equal("ccc||333||2")
        vm.object = {
            eee: 777,
            ddd: 444,
            aaa: 333,
            bbb: 555
        }
        setTimeout(function () {
            var lis = div.getElementsByTagName("li")
            expect(lis.length).to.equal(4)
            expect(lis[0].innerHTML.trim()).to.equal("eee||777||0")
            expect(lis[1].innerHTML.trim()).to.equal("ddd||444||1")
            expect(lis[2].innerHTML.trim()).to.equal("aaa||333||2")
            expect(lis[3].innerHTML.trim()).to.equal("bbb||555||3")
            vm.object = {
                eee: 111,
                ddd: 222,
                aaa: 444,
                bbb: 666,
                kkk: 999
            }
            setTimeout(function () {
                var lis = div.getElementsByTagName("li")
                expect(lis.length).to.equal(5)
                expect(lis[0].innerHTML.trim()).to.equal("eee||111||0")
                expect(lis[1].innerHTML.trim()).to.equal("ddd||222||1")
                expect(lis[2].innerHTML.trim()).to.equal("aaa||444||2")
                expect(lis[3].innerHTML.trim()).to.equal("bbb||666||3")
                expect(lis[4].innerHTML.trim()).to.equal("kkk||999||4")

                done()
            })
        })

    })
    it("double repeat+ms-class", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <table ms-controller="repeat5">
             <tbody>
             <tr ms-repeat-db="databases">
             <td>{{db.lastSample.queries.length}}</td>
             <td ms-repeat-q="db.lastSample.queries" ms-class="{{q.name}}">
             {{q.query}}
             </td>
             </tr>
             </tbody>
             </table>
             */
        })
        vm = avalon.define({
            $id: "repeat5",
            databases: [{
                    dbname: "ddd",
                    lastSample: {
                        name: "first",
                        queries: [{
                                name: "second",
                                query: "111s"
                            }, {
                                name: "dsd",
                                query: "23d"
                            }]
                    }
                }]
        })
        avalon.scan(div, vm)
        var tds = div.getElementsByTagName("td")
        expect(tds[0].innerHTML.trim()).to.equal("2")
        expect(tds[1].innerHTML.trim()).to.equal("111s")
        expect(tds[1].className.trim()).to.equal("second")
        expect(tds[2].innerHTML.trim()).to.equal("23d")
        expect(tds[2].className.trim()).to.equal("dsd")

        var a = [{
                dbname: "ddd",
                lastSample: {
                    name: "first",
                    queries: [{
                            name: "aaa",
                            query: "aaa"
                        }, {
                            name: "bbb",
                            query: "bbb"
                        },
                        {
                            name: "ccc",
                            query: "ccc"
                        }, {
                            name: "ddd",
                            query: "ddd"
                        }]
                }
            }]

        vm.databases = a
        setTimeout(function () {
            expect(tds[0].innerHTML.trim()).to.equal("4")
            expect(tds[1].innerHTML.trim()).to.equal("aaa")
            expect(tds[1].className.trim()).to.equal("aaa")
            expect(tds[2].innerHTML.trim()).to.equal("bbb")
            expect(tds[2].className.trim()).to.equal("bbb")
            expect(tds[3].innerHTML.trim()).to.equal("ccc")
            expect(tds[3].className.trim()).to.equal("ccc")
            expect(tds[4].innerHTML.trim()).to.equal("ddd")
            expect(tds[4].className.trim()).to.equal("ddd")
            done()
        })
    })
    it("replace object key and value", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <ul ms-controller="repeat6">
             <li ms-repeat="d in object">{{d}};;;{{$key}}</li>
             </ul>
             */
        })
        vm = avalon.define({
            $id: "repeat6",
            object: {
                aaa: 111,
                bbb: 222
            }
        })
        avalon.scan(div, vm)
        var lis = div.getElementsByTagName("li")
        expect(lis.length).to.equal(2)
        expect(lis[0].innerHTML.trim()).to.equal("111;;;aaa")
        expect(lis[1].innerHTML.trim()).to.equal("222;;;bbb")
        avalon.each(lis, function (i, el) {
            el.title = el.innerHTML
        })
        vm.object = {
            a: 333,
            b: 444,
            c: 555,
            $d: 666
        }
        setTimeout(function () {
            expect(lis.length).to.equal(4)
            expect(lis[0].innerHTML.trim()).to.equal("333;;;a")
            expect(lis[1].innerHTML.trim()).to.equal("444;;;b")
            expect(lis[2].innerHTML.trim()).to.equal("555;;;c")
            expect(lis[3].innerHTML.trim()).to.equal("666;;;$d")
            expect(lis[0].title).to.equal("111;;;aaa")
            expect(lis[1].title).to.equal("222;;;bbb")
            done()
        })
    })

    it("ms-each+ms-with", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <ul ms-controller="repeat7">
             <li ms-repeat="array">
             <p ms-repeat="el">{{$key}}||{{$val}}||{{$index}}</p>
             </li>
             </ul>
             */
        })
        vm = avalon.define({
            $id: "repeat7",
            array: [{a: 1, b: 2}, {a: 3, b: 4}]
        })
        avalon.scan(div, vm)
        var ps = div.getElementsByTagName("p")
        expect(ps[0].innerHTML.trim()).to.equal("a||1||0")
        expect(ps[1].innerHTML.trim()).to.equal("b||2||1")
        expect(ps[2].innerHTML.trim()).to.equal("a||3||0")
        expect(ps[3].innerHTML.trim()).to.equal("b||4||1")
        avalon.each(ps, function (i, el) {
            el.title = el.innerHTML
        })
        vm.array = [{a: 15, b: 25}, {a: 33, c: 44, b: 78}, {a: 55, b: 66}]
        setTimeout(function () {
            expect(ps[0].innerHTML.trim()).to.equal("a||15||0")
            expect(ps[1].innerHTML.trim()).to.equal("b||25||1")
            expect(ps[2].innerHTML.trim()).to.equal("a||33||0")
            expect(ps[3].innerHTML.trim()).to.equal("c||44||1")
            expect(ps[4].innerHTML.trim()).to.equal("b||78||2")
            expect(ps[5].innerHTML.trim()).to.equal("a||55||0")
            expect(ps[6].innerHTML.trim()).to.equal("b||66||1")
            expect(ps[0].title).to.equal("a||1||0")
            expect(ps[1].title).to.equal("b||2||1")
            expect(ps[2].title).to.equal("a||3||0")
            expect(ps[3].title).to.equal("")
            expect(ps[4].title).to.equal("b||4||1")
            expect(ps[5].title).to.equal("")
            vm.array[0].a = 999
            vm.array[0].b = 888
            setTimeout(function () {
                expect(ps[0].innerHTML.trim()).to.equal("a||999||0")
                expect(ps[1].innerHTML.trim()).to.equal("b||888||1")
                done()
            })

        })
    })

    it("ms-with+ms-each", function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <ul ms-controller="repeat8">
             <li ms-repeat="tr in grid">
             <p ms-repeat="td in tr">{{td}}</p>
             </li>
             </ul>
             */
        })
        vm = avalon.define({
            $id: "repeat8",
            grid: [{a: 111, b: 222}]
        })
        avalon.scan(div, vm)
        avalon.scan(div, vm)
        var ps = div.getElementsByTagName("p")
        expect(ps[0].innerHTML.trim()).to.equal("111")
        expect(ps[1].innerHTML.trim()).to.equal("222")
        vm.grid = [{c: 123, d: 456, a: 789}, {a: 333, b: 444, c: "yui"}]

        vm.grid[0].c = 999
        vm.grid[0].a = 888
        vm.grid[1].b = 777
        setTimeout(function () {
            expect(ps[0].innerHTML.trim()).to.equal("999")
            expect(ps[1].innerHTML.trim()).to.equal("456")
            expect(ps[2].innerHTML.trim()).to.equal("888")
            expect(ps[3].innerHTML.trim()).to.equal("333")
            expect(ps[4].innerHTML.trim()).to.equal("777")
            expect(ps[5].innerHTML.trim()).to.equal("yui")
            done()
        })

    })
})