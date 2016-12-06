import { avalon } from '../../src/seed/core'

describe('for', function() {
    var body = document.body, div, vm
    beforeEach(function() {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function() {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('简单的一维数组循环,一维对象循环,使用注释实现循环', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='for0' >
             <ul>
             <li ms-for='($index, el) in @array | limitBy(4)' data-for-rendered="@fn">{{$index}}::{{el}}</li>
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
        var called = false
        vm = avalon.define({
            $id: 'for0',
            array: [1, 2, 3, 4, 5],
            fn: function() {
                called = true
            },
            object: {
                a: 11,
                b: 22,
                c: 33,
                d: 44,
                e: 55
            }
        })
        avalon.scan(div)
        setTimeout(function() {
            var lis = div.getElementsByTagName('li')
            var ps = div.getElementsByTagName('p')
            expect(lis[0].innerHTML).toBe('0::1')
            expect(lis[1].innerHTML).toBe('1::2')
            expect(lis[2].innerHTML).toBe('2::3')
            expect(lis[3].innerHTML).toBe('3::4')
            expect(lis[4].innerHTML).toBe('a::11')
            expect(lis[5].innerHTML).toBe('b::22')
            expect(lis[6].innerHTML).toBe('c::33')
            expect(lis[7].innerHTML).toBe('d::44')
            expect(lis[8].innerHTML).toBe('e::55')
            expect(ps[0].innerHTML).toBe('1')
            expect(ps[1].innerHTML).toBe('2')
            expect(ps[2].innerHTML).toBe('3')
            expect(ps[3].innerHTML).toBe('4')
            expect(ps[4].innerHTML).toBe('5')
            expect(called).toBe(true)
            vm.array.reverse()
            vm.array.unshift(9)
            setTimeout(function() {
                expect(lis[0].innerHTML + "!").toBe('0::9!')
                expect(lis[1].innerHTML).toBe('1::5')
                expect(lis[2].innerHTML).toBe('2::4')
                expect(lis[3].innerHTML).toBe('3::3')
                expect(ps[0].innerHTML).toBe('9')
                expect(ps[1].innerHTML).toBe('5')
                expect(ps[2].innerHTML).toBe('4')
                expect(ps[3].innerHTML).toBe('3')
                expect(ps[4].innerHTML).toBe('2')
                done()
            }, 300)
        }, 300)
    })

    it('双层循环,并且重复利用已有的元素节点', function(done) {

        div.innerHTML = heredoc(function() {
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
            array: [[1, 2, 3], [4, 5, 6], [7, 8, 9, 10]]
        })
        avalon.scan(div)
        setTimeout(function() {
            var tds = div.getElementsByTagName('td')

            expect(tds[0].innerHTML).toBe('1')
            expect(tds[1].innerHTML).toBe('2')
            expect(tds[2].innerHTML).toBe('3')
            expect(tds[3].innerHTML).toBe('4')
            expect(tds[4].innerHTML).toBe('5')
            expect(tds[5].innerHTML).toBe('6')
            expect(tds[6].innerHTML).toBe('7')
            expect(tds[7].innerHTML).toBe('8')
            expect(tds[8].innerHTML).toBe('9')
            expect(tds[9].innerHTML).toBe('10')
            avalon.each(tds, function(i, el) {
                el.title = el.innerHTML
            })
            vm.array = [[11, 22, 33], [44, 55, 66], [77, 88, 99]]
            setTimeout(function() {
                expect(tds.length).toBe(9)
                expect(tds[0].innerHTML).toBe('11')
                expect(tds[1].innerHTML).toBe('22')
                expect(tds[2].innerHTML).toBe('33')
                expect(tds[3].innerHTML).toBe('44')
                expect(tds[4].innerHTML).toBe('55')
                expect(tds[5].innerHTML).toBe('66')
                expect(tds[6].innerHTML).toBe('77')
                expect(tds[7].innerHTML).toBe('88')
                expect(tds[8].innerHTML).toBe('99')

                expect(tds[0].title).toBe('1')
                expect(tds[1].title).toBe('2')
                expect(tds[2].title).toBe('3')
                expect(tds[3].title).toBe('4')
                expect(tds[4].title).toBe('5')
                expect(tds[5].title).toBe('6')
                expect(tds[6].title).toBe('7')
                expect(tds[7].title).toBe('8')
                expect(tds[8].title).toBe('9')
                done()
            })
        })
    })
    it('监听数组长度变化', function(done) {
        div.innerHTML = heredoc(function() {
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
        setTimeout(function() {
            var options = div.getElementsByTagName('option')

            expect(options[0].innerHTML).toBe('2')
            expect(options[1].innerHTML).toBe('3')

            vm.array = [['a', "b", "c", "d"], [3, 4, 6, 7, 8]]
            setTimeout(function() {

                expect(options[0].innerHTML).toBe('4')
                expect(options[1].innerHTML).toBe('5')
                done()
            })
        })
    })

    it('添加新的对象元素', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <ul ms-controller='for3'>
             <li ms-for='el in @array'>{{el.a}}</li>
             </ul>
             */
        })
        vm = avalon.define({
            $id: 'for3',
            array: [{ a: 1 }]
        })
        avalon.scan(div)
        setTimeout(function() {
            var lis = div.getElementsByTagName('li')

            expect(lis[0].innerHTML).toBe('1')

            vm.array = [{ a: 2 }, { a: 3 }]
            setTimeout(function() {

                expect(lis[0].innerHTML).toBe('2')
                expect(lis[1].innerHTML).toBe('3')
                done()
            }, 100)
        })
    })

    it('ms-if与ms-for并用', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='for4'>
             <div class='panel' ms-for='(jj, el) in @panels' 
             ms-if='jj === @curIndex' 
             ms-html='el'></div>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'for4',
            curIndex: 0, //默认显示第一个
            panels: ["<div>面板1</div>", "<p>面板2</p>", "<strong>面板3</strong>"]
        })
        avalon.scan(div, vm)
        setTimeout(function() {
            var ds = div.getElementsByTagName('div')
            expect(ds[0][textProp]).toBe('面板1')
            vm.curIndex = 1
            setTimeout(function() {
                expect(ds[0][textProp]).toBe('面板2')
                vm.curIndex = 2
                setTimeout(function() {
                    expect(ds[0][textProp]).toBe('面板3')
                    done()
                }, 100)
            }, 100)
        }, 100)
    })
 it('使用注释循环', function(done) {
        //在IE6-8中,div.innerHTML =str, 如果里面的元素标签素直接跟注释节点会被移除,
        //这与空白节点的情况一样
        //这里在前面加一个&nbsp;就好了
        var removeFirstComment = heredoc(function() {
            /*
             <div ms-controller="for5">
             <!--ms-for:el in @forlist-->
             <p>{{el}}</p>
             <!--ms-for-end:-->
             </div>
             */
        })
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="for5">
             &nbsp;<!--ms-for:el in @forlist-->
             <p>{{el}}</p>
             <!--ms-for-end:-->
             </div>
             */
        })

        vm = avalon.define({
            $id: "for5",
            forlist: [1, 2, 3]
        })
        avalon.scan(div)
        setTimeout(function() {
            var ps = div.getElementsByTagName('p')
            console.log(div.innerHTML,'00000')
            expect(ps.length).toBe(3)

            done()
        }, 300)
    })

    it('ms-duplex与ms-for并用', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <table ms-controller="for6" border="1">
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
            $id: "for6",
            data: [{ checked: false }, { checked: false }, { checked: false }],
            allchecked: false,
            checkAll: function(e) {
                var checked = e.target.checked
                vm.data.forEach(function(el) {
                    el.checked = checked
                })
            },
            checkOne: function(e) {
                var checked = e.target.checked
                if (checked === false) {
                    vm.allchecked = false
                } else {//avalon已经为数组添加了ecma262v5的一些新方法
                    vm.allchecked = vm.data.every(function(el) {
                        return el.checked
                    })
                }
            }
        })
        avalon.scan(div, vm)
        setTimeout(function() {
            var ths = div.getElementsByTagName('th')
            var inputs = div.getElementsByTagName('input')

            var prop = 'innerText' in div ? 'innerText' : 'textContent'
            expect(ths[0][prop]).toBe('0::false')
            expect(ths[1][prop]).toBe('1::false')
            expect(ths[2][prop]).toBe('2::false')
            fireClick(inputs[0])
            setTimeout(function() {
                expect(ths[0][prop]).toBe('0::true')
                expect(ths[1][prop]).toBe('1::true')
                expect(ths[2][prop]).toBe('2::true')
                done()
            }, 100)
        }, 100)
    })
   
    it('数组循环+对象循环', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <table ms-controller="for7" >
             <tr ms-for="el in @list">
             <td ms-for="elem in el">{{elem}}</td>
             </tr>
             </table>
             */
        })
        vm = avalon.define({
            $id: 'for7',
            list: [{ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 }]
        })
        avalon.scan(div)
        setTimeout(function() {
            var tds = div.getElementsByTagName('td')
            expect(tds.length).toBe(9)
            done()
        }, 300)
    })
    it('ms-for+ms-text', function(done) {
        //https://github.com/RubyLouvre/avalon/issues/1422
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="for8" >
             <p ms-for="el in @list">{{el}}</p>
             <strong>{{@kk}}</strong>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'for8',
            list: [],
            kk: 22
        })
        avalon.scan(div)
        setTimeout(function() {
            var el = div.getElementsByTagName('strong')[0]
            expect(el.innerHTML.trim()).toBe('22')
            done()
        }, 300)
    })

    it('简单对象循环,这个临时加上', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller='for9' >
             <ul>
             <li ms-for='($index, el) in @array |limitBy(4) as list' data-for-rendered="@fn">{{$index}}::{{el}}::{{list.length}}</li>
             </ul>
             </div>
             */
        })
        var called = false
        vm = avalon.define({
            $id: 'for9',
            array: [1, 2, 1, 2, 3],
            fn: function() {
                called = true
            }
        })
        avalon.scan(div)
        setTimeout(function() {
            var lis = div.getElementsByTagName('li')
            var ps = div.getElementsByTagName('p')
            expect(lis[0].innerHTML).toBe('0::1::4')
            expect(lis[1].innerHTML).toBe('1::2::4')
            expect(lis[2].innerHTML).toBe('2::1::4')
            expect(lis[3].innerHTML).toBe('3::2::4')
            expect(lis.length).toBe(4)
            expect(called).toBe(true)
            vm.array.reverse()
            setTimeout(function() {
                expect(lis[0].innerHTML).toBe('0::3::4')
                expect(lis[1].innerHTML).toBe('1::2::4')
                expect(lis[2].innerHTML).toBe('2::1::4')
                expect(lis[3].innerHTML).toBe('3::2::4')
                done()
            })

        }, 300)

    })
    it('ms-if+ms-for', function(done) {
        div.innerHTML = heredoc(function() {
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
        setTimeout(function() {
            var ss = div.getElementsByTagName('li')
            expect(ss.length).toBe(2)
            vm.toggle = false
            setTimeout(function() {
                var ss = div.getElementsByTagName('li')
                expect(ss.length).toBe(0)
                vm.toggle = true
                setTimeout(function() {
                    var ss = div.getElementsByTagName('li')
                    expect(ss.length).toBe(2)
                    done()
                })
            })
        })

    })

    it('ms-text+ms-for', function(done) {
        div.innerHTML = heredoc(function() {
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
        setTimeout(function() {
            var ss = div.getElementsByTagName('p')
            expect(ss.length).toBe(3)
            expect(ss[0].innerHTML).toBe('111')
            expect(ss[1].innerHTML).toBe('222')
            expect(ss[2].innerHTML).toBe('333')

            done()

        }, 100)

    })

    it('复杂数据的排序', function(done) {
        div.innerHTML = heredoc(function() {
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
            { "Caption_Chs": "分店编码", "ColumnType": "nvarchar" },
            { "Caption_Chs": "公司名称", "ColumnType": "nvarchar" },
            { "Caption_Chs": "公司名称02", "ColumnType": "nvarchar" },
            { "Caption_Chs": "公司名称03", "ColumnType": "nvarchar" },
            { "Caption_Chs": "公司名称04", "ColumnType": "nvarchar" },
            { "Caption_Chs": "中文地址01", "ColumnType": "nvarchar" },
            { "Caption_Chs": "中文地址02", "ColumnType": "nvarchar" },
            { "Caption_Chs": "中文地址03", "ColumnType": "nvarchar" },
            { "Caption_Chs": "公司地址04", "ColumnType": "nvarchar" },
            { "Caption_Chs": "英文地址01", "ColumnType": "nvarchar" },
            { "Caption_Chs": "联系人", "ColumnType": "nvarchar" },
            { "Caption_Chs": "电话", "ColumnType": "nvarchar" },
            { "Caption_Chs": "传真", "ColumnType": "nvarchar" },
            { "Caption_Chs": "预设折扣%", "ColumnType": "decimal" },
            { "Caption_Chs": "简称", "ColumnType": "nvarchar" }
        ];
        vm = avalon.define({
            $id: "for12",
            //必须深拷贝数组,防止 原Data受到影响变成一个vm数组 ,导致vm.arary = vm数组
            //http://avalonjs.coding.me/cn/question.html
            list: avalon.mix(true, [], Data)
        });
        avalon.scan(div)
        setTimeout(function() {
            Data.push({
                "Caption_Chs": "新内容",
                "ColumnType": "nvarchar"
            });
            vm.list = avalon.mix(true, [], Data);
            setTimeout(function() {
                var divs = div.getElementsByTagName('div')
                expect(divs[0].innerHTML).toBe('0-分店编码')
                expect(divs[1].innerHTML).toBe('1-公司名称')
                expect(divs[2].innerHTML).toBe('2-公司名称02')
                expect(divs[3].innerHTML).toBe('3-公司名称03')
                expect(divs[4].innerHTML).toBe('4-公司名称04')
                expect(divs[5].innerHTML).toBe('5-中文地址01')
                expect(divs[6].innerHTML).toBe('6-中文地址02')
                expect(divs[7].innerHTML).toBe('7-中文地址03')
                expect(divs[8].innerHTML).toBe('8-公司地址04')
                expect(divs[9].innerHTML).toBe('9-英文地址01')
                expect(divs[10].innerHTML).toBe('10-联系人')
                expect(divs[11].innerHTML).toBe('11-电话')
                expect(divs[12].innerHTML).toBe('12-传真')
                expect(divs[13].innerHTML).toBe('13-预设折扣%')
                expect(divs[14].innerHTML).toBe('14-简称')
                expect(divs[15].innerHTML).toBe('15-新内容')
                done()
            }, 100)
        }, 100);
    })
    it('多次扫描同一个区域', function(done) {
        //https://github.com/RubyLouvre/avalon/issues/1830
        div.innerHTML = heredoc(function() {
            /*
             <ul ms-controller="for13">
             <li>zzz</li>
             <li ms-for="el in @arr">{{el}}</li>    
             </ul>
             */
        })

        vm = avalon.define({
            $id: 'for13',
            arr: ['aaa', 'bbb', 'ccc'],
            bbb: true
        });
        avalon.scan(div)
        setTimeout(function() {
            var lis = div.getElementsByTagName('li')
            expect(lis.length).toBe(4)
            avalon.scan(div)
            setTimeout(function() {
                lis = div.getElementsByTagName('li')
                expect(lis.length).toBe(4)
                done()
            },100)
           
        }, 100)
    })

    it('注解for指令嵌套问题', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             
             <style>
             .c-red {
             color: red;
             }
             .c-green {
             color: green;
             }
             .c-blue {
             color: blue;
             }
             </style>
             <div ms-controller="for14">
             &nbsp;<!--ms-for:(idx1, item1) in @arr-->
             <p>Group这是标题</p>
             &nbsp;<!--ms-for:(idx2, item2) in item1-->
             <div>内容1</div>
             <strong :class="'c-' + (idx1 < 1 ? 'red' : idx1 > 1 ? 'green' : 'blue')">
             内容2 {{ (idx1 < 1 ? 'red' : idx1 > 1 ? 'green' : 'blue') + '-' + item2 }}
             </strong>
             &nbsp;<!--ms-for-end:-->
             &nbsp;<!--ms-for-end:-->
             </div>
             */
        })

        vm = avalon.define({
            $id: 'for14',
            arr: [
                { a: 'a1', b: 'b1' }, { a: 'a2', b: 'b2' }, { a: 'a3', b: 'b3' }
            ]
        });
        avalon.scan(div)
        setTimeout(function() {
            var strongs = div.getElementsByTagName('strong')
            expect(strongs.length).toBe(6)
            done()
        }, 150)
    })

    it('修正误用前面的节点当循环区域的父节点的问题', function(done) {
        //https://github.com/RubyLouvre/avalon/issues/1646
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="for15">
             <div :for="item in @data1" aa='99'>{{item}}</div>
             <div id='for15'>
             <div :for="item in @data2">{{item}}</div>
             </div>
             </div>
             */
        })

        vm = avalon.define({
            $id: 'for15',
            data1: [1, 2, 3, 4, 5],
            data2: [11, 22, 33, 44, 55]
        })
        setTimeout(function() {
            var el = document.getElementById('for15')
            expect(!!el).toBe(true)
            done()
        }, 300)
    })

    it('local.$index不更新的BUG', function(done) {
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="for16">
             <div :for="($index,item) in @arr" >
             <b :click="@fn($index)"></b>
             {{item}}
             </div>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'for16',
            arr: [2, 3, 4],
            fn: function() { }
        })
        avalon.scan(div)
        setTimeout(function() {
            var bs = div.getElementsByTagName('b')
            expect(bs[0]._ms_context_.$index).toBe(0)
            expect(bs[0]._ms_context_.item).toBe(2)
            expect(bs[1]._ms_context_.$index).toBe(1)
            expect(bs[1]._ms_context_.item).toBe(3)
            expect(bs[2]._ms_context_.$index).toBe(2)
            expect(bs[2]._ms_context_.item).toBe(4)
            vm.arr.unshift(7)
            setTimeout(function() {
                bs = div.getElementsByTagName('b')
                expect(bs[0]._ms_context_.$index).toBe(0)
                expect(bs[0]._ms_context_.item).toBe(7)
                expect(bs[1]._ms_context_.$index).toBe(1)
                expect(bs[1]._ms_context_.item).toBe(2)
                expect(bs[2]._ms_context_.$index).toBe(2)
                expect(bs[2]._ms_context_.item).toBe(3)
                expect(bs[3]._ms_context_.$index).toBe(3)
                expect(bs[3]._ms_context_.item).toBe(4)
                done()
            }, 300)

        }, 300)
    })
    it('diff', function() {
        var diff = avalon.directives.for.diff
        var obj = {
            oldTrackIds: "xxx"
        }
        var val = diff.call(obj, [1, 2, 3, 4])
        expect(obj.updating).toBe(true)
        expect(obj.oldTrackIds).toBe('number:1;;number:2;;number:3;;number:4')
        expect(val).toBe(true)
    })
    it('beforeInit', function() {
        var diff = avalon.directives.for.beforeInit
        var obj = {
            expr: 'el in @arr as 111'
        }
        try {
            diff.call(obj)
        } catch (e) {
            expect('invalid').toMatch(/invalid/)
        }
        obj = {
            expr: 'el in @arr as for'
        }
        try {
            diff.call(obj)
        } catch (e) {
            expect('invalid').toMatch(/invalid/)
        }
        obj = {
            expr: 'el in @arr as kkk'
        }
        diff.call(obj)
        expect(obj.keyName).toBe('$key')
        expect(obj.valName).toBe('el')
        expect(obj.asName).toBe('kkk')
        expect(obj.signature).toMatch(/^for\d+/)
        expect(obj.expr).toBe('@arr')

    })
    it('对象数组', function(done) {
        //https://github.com/RubyLouvre/avalon/issues/1786
        div.innerHTML = heredoc(function() {
            /*
             <ul ms-controller="for17">
             <li ms-for="key,el in @dataArray">
             <span>{{el.brandName}}</span>
             <span>{{el.gearType}}</span>
             </li>
             </ul>
             */
        })
        vm = avalon.define({
            $id: "for17",
            dataArray: [
                {
                    brandName: "大众",
                    gearType: "非自动",
                }
            ]
        })
        avalon.scan(div)

        setTimeout(function() {
            vm.dataArray = [
                {
                    brandName: "大众2",
                    gearType: "手动|自动"

                },
                {
                    brandName: "大众3",
                    gearType: "手动|自动"

                }
            ]
            var lis = div.getElementsByTagName('li')
            expect(lis[0][textProp]).toBe('大众2手动|自动')
            expect(lis[1][textProp]).toBe('大众3手动|自动')
            done()
        }, 200)
    })
    it('子项的绑定显示问题', function(done) {
        //https://github.com/RubyLouvre/avalon/issues/1786
        div.innerHTML = heredoc(function() {
            /*
             <ul ms-controller="for18">
             <div ms-for="item in @list">
             <p style="background:#f00;margin:10px;" 
             ms-click="@select(item)">{{ item.name }}</p>
             <label style="background:#00f;margin:10px;" 
             ms-for="jel in item.child" ms-click="@select(jel)">
             {{ jel.name }}
             </label>
             </div>
             
             <p>当前对象</p>
             <form>
             name:{{ @current.name }}
             <br/>
             child:
             <span ms-for="j in @current.child">{{ j.name }}</span>
             </from>
             </ul>
             */
        })
        function p(_name) {
            this.name = _name;
            this.child = [];
        }
        vm = avalon.define({
            $id: "for18",
            list: [],
            current: null,
            select: function(el) {
                vm.current = el;
            }
        })
        var arr = [];
        var z = new p("张三");
        z.child.push(new p("子1"));
        z.child.push(new p("子2"));
        arr.push(z);
        arr.push(new p("李四"));
        vm.list = arr;
        avalon.scan(div)
        var ps = div.getElementsByTagName('p')
        var labels = div.getElementsByTagName('label')
        function getData() {
            var text = div.getElementsByTagName('form')[0][textProp]
            return text.replace(/[\r\n\s]/g, '').trim()
        }
        setTimeout(function() {
            fireClick(ps[0])
            expect(getData()).toBe('name:张三child:子1子2')
            fireClick(ps[1])
            expect(getData()).toBe('name:李四child:')
            fireClick(labels[0])
            expect(getData()).toBe('name:子1child:')
            fireClick(labels[1])
            expect(getData()).toBe('name:子2child:')
            done()
        }, 200)
    })

    it('子项的绑定显示问题2', function(done) {
        //https://github.com/RubyLouvre/avalon/issues/1786
        div.innerHTML = heredoc(function() {
            /*
             <div ms-controller="for19">
             <section ms-if="@Ad_Article.data.news_detail.list.length>0">
             <a class="box ad-box" ms-for="item in @Ad_Article.data.news_detail.list" >
             <strong ms-text="item.title"></strong>
          
             </a>
             </section>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'for19',
            Ad_Article: {
                type: 'err',
                data: {
                    news_detail: {
                        list: [
                        ]
                    },
                    top: {
                        list: []
                    }
                }
            }
        });
        avalon.scan(div)
        setTimeout(function() {
            vm.Ad_Article = {
                type: 'err',
                data: {
                    news_detail: {
                        list: [
                            {
                                "title": "123"
                            }, {
                                "title": "456"
                            }
                        ]
                    }
                }
            }
            var s = div.getElementsByTagName('strong')
            expect(s[0].innerHTML).toBe('123')
            expect(s[1].innerHTML).toBe('456')
            done()
        }, 100)
    })
})