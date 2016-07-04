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
describe('for', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('简单的一维数组循环,一维对象循环,使用注释实现循环', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='for0' >
             <ul>
             <li ms-for='($index, el) in @array | limitBy(4)'>{{$index}}::{{el}}</li>
             </ul>
             <ol>
             <li ms-for='($key, $val) in @object'>{{$key}}::{{$val}}</li>
             </ol>
             <!--ms-for: ($index,el) in @array   -->
             <p>{{el}}</p>
             <!--ms-for-end:-->
             </div>
             */
        })
        vm = avalon.define({
            $id: 'for0',
            array: [1, 2, 3, 4, 5],
            object: {
                a: 11,
                b: 22,
                c: 33,
                d: 44,
                e: 55
            }
        })
        avalon.scan(div)
        setTimeout(function () {
            var lis = div.getElementsByTagName('li')
            var ps = div.getElementsByTagName('p')
            expect(lis[0].innerHTML).to.equal('0::1')
            expect(lis[1].innerHTML).to.equal('1::2')
            expect(lis[2].innerHTML).to.equal('2::3')
            expect(lis[3].innerHTML).to.equal('3::4')
            expect(lis[4].innerHTML).to.equal('a::11')
            expect(lis[5].innerHTML).to.equal('b::22')
            expect(lis[6].innerHTML).to.equal('c::33')
            expect(lis[7].innerHTML).to.equal('d::44')
            expect(lis[8].innerHTML).to.equal('e::55')
            expect(ps[0].innerHTML).to.equal('1')
            expect(ps[1].innerHTML).to.equal('2')
            expect(ps[2].innerHTML).to.equal('3')
            expect(ps[3].innerHTML).to.equal('4')
            expect(ps[4].innerHTML).to.equal('5')
            vm.array.reverse()
            vm.array.unshift(9)
            setTimeout(function () {
                expect(lis[0].innerHTML + "!").to.equal('0::9!')
                expect(lis[1].innerHTML).to.equal('1::5')
                expect(lis[2].innerHTML).to.equal('2::4')
                expect(lis[3].innerHTML).to.equal('3::3')
                expect(ps[0].innerHTML).to.equal('9')
                expect(ps[1].innerHTML).to.equal('5')
                expect(ps[2].innerHTML).to.equal('4')
                expect(ps[3].innerHTML).to.equal('3')
                expect(ps[4].innerHTML).to.equal('2')
                done()
            }, 300)
        }, 300)
    })

    it('双层循环,并且重复利用已有的元素节点', function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='for1'>
             <table>
             <tr ms-for='tr in @array'>
             <td ms-for='td in tr'>{{td}}</td>
             </tr>
             </table>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'for1',
            array: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
        })
        avalon.scan(div)
        setTimeout(function () {
            var tds = div.getElementsByTagName('td')

            expect(tds[0].innerHTML).to.equal('1')
            expect(tds[1].innerHTML).to.equal('2')
            expect(tds[2].innerHTML).to.equal('3')
            expect(tds[3].innerHTML).to.equal('4')
            expect(tds[4].innerHTML).to.equal('5')
            expect(tds[5].innerHTML).to.equal('6')
            expect(tds[6].innerHTML).to.equal('7')
            expect(tds[7].innerHTML).to.equal('8')
            expect(tds[8].innerHTML).to.equal('9')
            avalon.each(tds, function (i, el) {
                el.title = el.innerHTML
            })
            vm.array = [[11, 22, 33], [44, 55, 66], [77, 88, 99]]
            setTimeout(function () {

                expect(tds[0].innerHTML).to.equal('11')
                expect(tds[1].innerHTML).to.equal('22')
                expect(tds[2].innerHTML).to.equal('33')
                expect(tds[3].innerHTML).to.equal('44')
                expect(tds[4].innerHTML).to.equal('55')
                expect(tds[5].innerHTML).to.equal('66')
                expect(tds[6].innerHTML).to.equal('77')
                expect(tds[7].innerHTML).to.equal('88')
                expect(tds[8].innerHTML).to.equal('99')

                expect(tds[0].title).to.equal('1')
                expect(tds[1].title).to.equal('2')
                expect(tds[2].title).to.equal('3')
                expect(tds[3].title).to.equal('4')
                expect(tds[4].title).to.equal('5')
                expect(tds[5].title).to.equal('6')
                expect(tds[6].title).to.equal('7')
                expect(tds[7].title).to.equal('8')
                expect(tds[8].title).to.equal('9')
                done()
            })
        })
    })
    it('监听数组长度变化', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <select ms-controller='for2'>
             <option ms-for='el in @array'>{{el.length}}</option>
             </select>
             */
        })
        vm = avalon.define({
            $id: 'for2',
            array: [[1, 2], [3, 4, 5]]
        })
        avalon.scan(div)
        setTimeout(function () {
            var options = div.getElementsByTagName('option')

            expect(options[0].innerHTML).to.equal('2')
            expect(options[1].innerHTML).to.equal('3')

            vm.array = [['a', "b", "c", "d"], [3, 4, 6, 7, 8]]
            setTimeout(function () {

                expect(options[0].innerHTML).to.equal('4')
                expect(options[1].innerHTML).to.equal('5')
                done()
            })
        })
    })

    it('添加新的对象元素', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <ul ms-controller='for3'>
             <li ms-for='el in @array'>{{el.a}}</li>
             </ul>
             */
        })
        vm = avalon.define({
            $id: 'for3',
            array: [{a: 1}]
        })
        avalon.scan(div)
        setTimeout(function () {
            var lis = div.getElementsByTagName('li')

            expect(lis[0].innerHTML).to.equal('1')

            vm.array = [{a: 2}, {a: 3}]
            setTimeout(function () {

                expect(lis[0].innerHTML).to.equal('2')
                expect(lis[1].innerHTML).to.equal('3')
                done()
            })
        })
    })

    it('ms-if与ms-for并用', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <ul ms-controller='for4'>
             <div class='panel' ms-for='(jj, el) in @panels' ms-if='jj === @curIndex' ms-html='el'></div>
             </ul>
             */
        })
        vm = avalon.define({
            $id: 'for4',
            curIndex: 0, //默认显示第一个
            panels: ["<div>面板1</div>", "<p>面板2</p>", "<strong>面板3</strong>"]
        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var ds = div.getElementsByTagName('div')
            var prop = 'innerText' in div ? 'innerText' : 'textContent'
            expect(ds[0][prop]).to.equal('面板1')
            vm.curIndex = 1
            setTimeout(function () {
                expect(ds[0][prop]).to.equal('面板2')
                vm.curIndex = 2
                setTimeout(function () {
                    expect(ds[0][prop]).to.equal('面板3')
                    done()
                })
            })
        })
    })

    it('ms-duplex与ms-for并用', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <table ms-controller="for5" border="1">
             <tr>
             <td><input type="checkbox" 
             ms-duplex-checked="@allchecked" 
             data-duplex-changed="@checkAll"/>全选</td>
             </tr>
             <tr ms-for="($index, el) in @data" >
             <th><input type="checkbox" ms-duplex-checked="el.checked" data-duplex-changed="@checkOne" />{{$index}}::{{el.checked}}</th>
             </tr>
             </table>
             */
        })
        vm = avalon.define({
            $id: "for5",
            data: [{checked: false}, {checked: false}, {checked: false}],
            allchecked: false,
            checkAll: function (e) {
                var checked = e.target.checked
                vm.data.forEach(function (el) {
                    el.checked = checked
                })
            },
            checkOne: function (e) {
                var checked = e.target.checked
                if (checked === false) {
                    vm.allchecked = false
                } else {//avalon已经为数组添加了ecma262v5的一些新方法
                    vm.allchecked = vm.data.every(function (el) {
                        return el.checked
                    })
                }
            }
        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var ths = div.getElementsByTagName('th')
            var inputs = div.getElementsByTagName('input')

            var prop = 'innerText' in div ? 'innerText' : 'textContent'
            expect(ths[0][prop]).to.equal('0::false')
            expect(ths[1][prop]).to.equal('1::false')
            expect(ths[2][prop]).to.equal('2::false')
            fireClick(inputs[0])
            setTimeout(function () {
                expect(ths[0][prop]).to.equal('0::true')
                expect(ths[1][prop]).to.equal('1::true')
                expect(ths[2][prop]).to.equal('2::true')
                done()
            }, 100)
        })
    })
    it('使用注释循环', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="for6" >
             <!--ms-for:el in @forlist -->
             <p>{{el}}</p>
             <!--ms-for-end:-->
             </div>
             */
        })

        avalon.define({
            $id: "for6",
            forlist: [1, 2, 3]
        })
        avalon.scan(div)
        setTimeout(function () {
            var ps = div.getElementsByTagName('p')
            expect(ps.length).to.equal(3)

            done()
            delete avalon.vmodels.for6
        }, 300)
    })

    it('数组循环+对象循环', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <table ms-controller="for7" >
             <tr ms-for="el in @list">
             <td ms-for="elem in el">{{elem}}</td>
             </tr>
             </table>
             */
        })
        avalon.define({
            $id: 'for7',
            list: [{a: 1, b: 2, c: 3}, {a: 1, b: 2, c: 3}, {a: 1, b: 2, c: 3}]
        })
        avalon.scan(div)
        setTimeout(function () {
            var tds = div.getElementsByTagName('td')
            expect(tds.length).to.equal(9)
            done()
            delete avalon.vmodels.for7
        }, 300)
    })
    it('ms-for+ms-text', function (done) {
        //https://github.com/RubyLouvre/avalon/issues/1422
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="for8" >
             <p ms-for="el in @list">{{el}}</p>
             <strong>{{@kk}}</strong>
             </div>
             */
        })
        avalon.define({
            $id: 'for8',
            list: [],
            kk: 22
        })
        avalon.scan(div)
        setTimeout(function () {
            var el = div.getElementsByTagName('strong')[0]
            expect(el.innerHTML.trim()).to.equal('22')
            done()
            delete avalon.vmodels.for8
        }, 300)
    })

    it('双重循环,__local__对象传递问题', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="for9">
             <div ms-for="el in ##data">
             {{el.name}}
             <button type="button" ms-click="##add1(el)">添加</button>
             <div ms-for="item in el.list">
             <strong>{{item.name}}</strong>
             <em class="del" ms-click="##del(el,item)">删除</em>
             </div>
             </div>
             </div>
             */
        })
        var list = ["A", "B", "C"]
        vm = avalon.define({
            $id: "for9",
            data: [{name: "test", list: [{name: "item1"}]}],
            add1: function (el) {
                el.list.push({name: 'item' + list.shift()})
            },
            del: function (el, item) {
                el.list.remove(item)
            }
        })
        avalon.scan(div)
        setTimeout(function () {
            var ss = div.getElementsByTagName('strong')
            expect(ss[0].innerHTML.trim()).to.equal('item1')
            var btn = div.getElementsByTagName('button')[0]
            fireClick(btn)
            fireClick(btn)
            fireClick(btn)
            setTimeout(function () {
                expect(ss.length).to.equal(4)
                expect(ss[1].innerHTML.trim()).to.equal('itemA')
                expect(ss[2].innerHTML.trim()).to.equal('itemB')
                expect(ss[3].innerHTML.trim()).to.equal('itemC')
                var ems = div.getElementsByTagName('em')
                fireClick(ems[2])
                setTimeout(function () {
                    expect(ss.length).to.equal(3)
                    expect(ss[1].innerHTML.trim()).to.equal('itemA')
                    expect(ss[2].innerHTML.trim()).to.equal('itemC')

                    done()
                })

            })
        })

    })
    it('ms-if+ms-for', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="for10">
             <div ms-if="@toggle">
             <p class="am-text-danger">此处是带ms-if的内容</p>
             <ul class="am-list" >
             <li ms-for="el in @lists">{{el}}</li>
             </ul>
             </div>
             </div>
             */
        })

        vm = avalon.define({
            $id: 'for10',
            lists: ['你好', '司徒正美'],
            toggle: true
        });
        avalon.scan(div)
        setTimeout(function () {
            var ss = div.getElementsByTagName('li')
            expect(ss.length).to.equal(2)
            vm.toggle = false
            setTimeout(function () {
                var ss = div.getElementsByTagName('li')
                expect(ss.length).to.equal(0)
                vm.toggle = true
                setTimeout(function () {
                    var ss = div.getElementsByTagName('li')
                    expect(ss.length).to.equal(2)
                    done()
                })
            })
        })

    })

    it('ms-text+ms-for', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="for11">
             <p ms-for="el in @list" ms-text="el">{{el}}</p>
             </div>
             */
        })

        vm = avalon.define({
            $id: 'for11',
            list: [111, 222, 333]
        });
        avalon.scan(div)
        setTimeout(function () {
            var ss = div.getElementsByTagName('p')
            expect(ss.length).to.equal(3)
            expect(ss[0].innerHTML).to.equal('111')
            expect(ss[1].innerHTML).to.equal('222')
            expect(ss[2].innerHTML).to.equal('333')

            done()

        }, 100)

    })

    it('复杂数据的排序', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <form ms-controller="for12" style="height:100%;width:100%">
             <table border="1">
             <tr ms-for="($row, elem) in @list">
             <td>
             <div>{{$row}}-{{elem.Caption_Chs}}</div>
             </td>
             </tr>
             </table>
             </form>
             */
        })

        var Data = [
            {"Caption_Chs": "分店编码", "ColumnType": "nvarchar"},
            {"Caption_Chs": "公司名称", "ColumnType": "nvarchar"},
            {"Caption_Chs": "公司名称02", "ColumnType": "nvarchar"},
            {"Caption_Chs": "公司名称03", "ColumnType": "nvarchar"},
            {"Caption_Chs": "公司名称04", "ColumnType": "nvarchar"},
            {"Caption_Chs": "中文地址01", "ColumnType": "nvarchar"},
            {"Caption_Chs": "中文地址02", "ColumnType": "nvarchar"},
            {"Caption_Chs": "中文地址03", "ColumnType": "nvarchar"},
            {"Caption_Chs": "公司地址04", "ColumnType": "nvarchar"},
            {"Caption_Chs": "英文地址01", "ColumnType": "nvarchar"},
            {"Caption_Chs": "联系人", "ColumnType": "nvarchar"},
            {"Caption_Chs": "电话", "ColumnType": "nvarchar"},
            {"Caption_Chs": "传真", "ColumnType": "nvarchar"},
            {"Caption_Chs": "预设折扣%", "ColumnType": "decimal"},
            {"Caption_Chs": "简称", "ColumnType": "nvarchar"}
        ];
        vm = avalon.define({
            $id: "for12",
            //必须深拷贝数组,防止 原Data受到影响变成一个vm数组 ,导致vm.arary = vm数组
            //http://avalonjs.coding.me/cn/question.html
            list: avalon.mix(true, [], Data)
        });
        avalon.scan(div)
        setTimeout(function () {
            Data.push({"Caption_Chs": "新内容",
                "ColumnType": "nvarchar"
            });

            vm.list = avalon.mix(true, [], Data);
            setTimeout(function () {
                var divs = div.getElementsByTagName('div')
                expect(divs[0].innerHTML).to.equal('0-分店编码')
                expect(divs[1].innerHTML).to.equal('1-公司名称')
                expect(divs[2].innerHTML).to.equal('2-公司名称02')
                expect(divs[3].innerHTML).to.equal('3-公司名称03')
                expect(divs[4].innerHTML).to.equal('4-公司名称04')
                expect(divs[5].innerHTML).to.equal('5-中文地址01')
                expect(divs[6].innerHTML).to.equal('6-中文地址02')
                expect(divs[7].innerHTML).to.equal('7-中文地址03')
                expect(divs[8].innerHTML).to.equal('8-公司地址04')
                expect(divs[9].innerHTML).to.equal('9-英文地址01')
                expect(divs[10].innerHTML).to.equal('10-联系人')
                expect(divs[11].innerHTML).to.equal('11-电话')
                expect(divs[12].innerHTML).to.equal('12-传真')
                expect(divs[13].innerHTML).to.equal('13-预设折扣%')
                expect(divs[14].innerHTML).to.equal('14-简称')
                expect(divs[15].innerHTML).to.equal('15-新内容')
                done()
            }, 100)
        }, 100);
    })

})