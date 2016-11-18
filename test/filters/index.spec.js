import { avalon } from '../../src/filters/index'

describe('filters', function () {

    describe('uppercase', function () {
        var fn = avalon.filters.uppercase
        it('test', function () {
            expect(fn('aaa')).toBe('AAA')
        })
    })

    describe('lowercase', function () {
        var fn = avalon.filters.lowercase
        it('test', function () {
            expect(fn('AAA')).toBe('aaa')
        })
    })

    describe('escape', function () {
        var fn = avalon.filters.escape
        it('escapes "&" to "&amp;"', function () {
            expect(fn('&')).toBe('&amp;');
        });
        it('escapes null to 0', function () {
            expect(fn(null)).toBe('');
        });
        it('escapes "<" to "&lt;"', function () {
            expect(fn('<')).toBe('&lt;');
        });
        it('escapes ">" to "&gt;"', function () {
            expect(fn('>')).toBe('&gt;');
        });
        it('escapes \'"\' to "&quot;"', function () {
            expect(fn('"')).toBe('&quot;');
        });
        it('escapes "\'" to "&#39;"', function () {
            expect(fn("'")).toBe('&#39;');
        });
        it('escapes all special chars', function () {
            expect(fn("<&<&")).toBe('&lt;&amp;&lt;&amp;');
        });
        it('returns an empty string for null', function () {
            expect(fn(null)).toBe('');
        });
        it('returns an empty string for undefined', function () {
            expect(fn(null)).toBe('');
        });
        it('stringify non-string value', function () {
            expect(fn(1)).toBe('1');
        });
        it('returns "false" for false', function () {
            expect(fn(false)).toBe('false');
        });
    })

    describe('sanitize', function () {
        it('test', function () {
            var str = '<a href="javascript:fix">SSS</a><img onclick=333 src=http://tp2.sinaimg.cn/1823438905/180/40054009869/1/><p onfocus="aaa" ontap="ddd" title=eee onkeypress=eee>onmousewheel=eee<span onmouseup="ddd">DDD</span></p><script>alert(1)<\/script>222222'
            var ret = avalon.filters.sanitize(str)
            expect(ret.indexOf('fix')).toBe(-1)
            expect(ret.indexOf('onclick')).toBe(-1)
            expect(ret.indexOf('ontap')).toBe(-1)
            expect(ret.indexOf('onkeypress')).toBe(-1)
            expect(ret.indexOf('onfocus')).toBe(-1)
            expect(ret.indexOf('onmouseup')).toBe(-1)
            expect(ret.indexOf('<script')).toBe(-1)
            expect(ret.indexOf('onmousewheel')).not.toBe(-1)
        })
    })
    describe('camelize', function () {
        var fn = avalon.filters.camelize
        it('test', function () {
            expect(fn('aa-bb')).toBe('aaBb')
            expect(fn('aa_cb')).toBe('aaCb')
        })
    })

    describe('number', function () {
        var fn = avalon.filters.number
        it('test', function () {
            expect(fn(1234.56, 0)).toBe('1,235')
            expect(fn(1.234567, 1)).toBe('1.2')
            expect(fn(1111111111)).toBe('1,111,111,111.000')
            expect(fn(1111111111, 2, '.', '-')).toBe('1-111-111-111.00')
            expect(fn(2, 4)).toBe('2.0000')
            expect(fn(1250, 2)).toBe('1,250.00')
            expect(fn(1250, 2)).toBe('1,250.00')
            expect(fn(2000, 2, '.', '.')).toBe('2.000.00')
            expect(fn(1e-8, 8, '.', '')).toBe('0.00000001')
        })
    })

    describe('truncate', function () {
        var fn = avalon.filters.truncate
        it('test', function () {
            expect(fn('大跃进大发展', 5, '***')).toBe('大跃***')
            expect(fn('1122dsfdsfdsfdsfdffsfdsfewrewrw5')).toBe('1122dsfdsfdsfdsfdffsfdsfewr...')
            expect(fn('1122dsfdsfdsfdsfdffsfdsfewrewrw5', -5)).toBe('1122dsfdsfdsfdsfdffsfdsf...')
            expect(fn(null)).toBe('')
            expect(fn('')).toBe('')

        })
    })

    describe('currency', function () {
        var fn = avalon.filters.currency
        it('test', function () {
            expect(fn(2500)).toBe('¥2,500.00')
            expect(fn(2500, 'RMB')).toBe('RMB2,500.00')
        })
    })



    describe('filterBy', function () {
        var fn = avalon.filters.filterBy
        it('test', function () {

            try {
                fn(111)
            } catch (e) {
                expect(e).toBe('filterBy只能处理对象或数组')
            }


            expect(fn(['aaa', 'bbaa', 'ccc', 'daad'], 'aa')).toEqual(['aaa', 'bbaa', 'daad'])
            expect(fn(['aaa', 'bbaa', 'ccc', 'ddd'], '')).toEqual(['aaa', 'bbaa', 'ccc', 'ddd'])
            expect(fn(['aa11', '1122', '66', '2113'], 11)).toEqual(['aa11', '1122', '2113'])
            expect(fn(['aaa', 'bbaa', 'ccc', 'ddd'], true)).toEqual(['aaa', 'bbaa', 'ccc', 'ddd'])

            expect(fn(['aa11', '1122', '66', '2113'], function (a) {
                return /2/.test(a)
            })).toEqual(['1122', '2113'])
            expect(fn({
                a: 111,
                b: 212,
                c: 332
            }, function (a) {
                return /2/.test(a)
            })).toEqual({
                b: 212,
                c: 332
            })

        })
    })
    describe('selectBy', function () {
        var fn = avalon.filters.selectBy
        it('test', function () {

            expect(fn('aaa', 'aa')).toEqual('aaa')
            expect(fn(['aaa', 'bbaa', 'ccc', 'ddd'], '')).toEqual(['aaa', 'bbaa', 'ccc', 'ddd'])
            expect(fn({
                aaa: 1,
                bbb: 2,
                ccc: 3
            }, ['aaa', 'bbb'])).toEqual([1, 2])
            expect(fn({
                aaa: 1,
                bbb: 2,
                ccc: 3
            }, ['aaa', 'bbb', 'ddd'], { ddd: 4 })).toEqual([1, 2, 4])


        })
    })

    describe('limitBy', function () {
        var fn = avalon.filters.limitBy

        it('test', function () {
            try {
                fn(1111)
            } catch (e) {
                expect(e).toEqual('limitBy只能处理对象或数组');
            }
            expect(fn([11], 'ddd')).toEqual([11])
            expect(fn([11], NaN)).toEqual([11])
            expect(fn({ a: 1, b: 2, c: 3 }, 2)).toEqual({ a: 1, b: 2 })
            expect(fn([111, 222, 333, 444, 555], 2)).toEqual([111, 222])
            expect(fn([111, 222, 333, 444, 555], 7)).toEqual([111, 222, 333, 444, 555])
            expect(fn([111, 222, 333, 444, 555], 2, 2)).toEqual([333, 444])
            expect(fn([111, 222, 333, 444, 555, 666], 2, -2)).toEqual([555, 666])
            expect(fn([111, 222, 333, 444, 555, 666], 3.5)).toEqual([111, 222, 333])

        })
    })

    describe('orderBy', function () {
        var fn = avalon.filters.orderBy

        it('test', function () {
            try {
                fn(1111)
            } catch (e) {
                expect(e).toEqual('orderBy只能处理对象或数组');
            }
            expect(fn([{ a: 1 }, { a: 3 }, { a: 2 }, { a: 4 }], 'a', 1)).
                toEqual([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }])
            expect(fn([{ a: 1 }, { a: 3 }, { a: 2 }, { a: 5 }], 'a', -1)).
                toEqual([{ a: 5 }, { a: 3 }, { a: 2 }, { a: 1 }])
            var newArr = fn([{ a: 1 }, { a: NaN }, { a: 2 }, { a: NaN }], 'a')
            expect(newArr).
                toEqual([{ a: 1 }, { a: 2 }, { a: NaN }, { a: NaN }])
            expect(newArr.map(function (el) { return el.a }).join(',')).toBe('1,2,NaN,NaN')
            expect(fn([1,3,8,2], 111)).toEqual([1,2,3,8])
            expect(fn([111, 222, 33, 444, 5585], function (a) {
                return String(a).length
            })).toEqual([33, 111, 222, 444, 5585])
            expect(fn({
                a: { v: 4 },
                d: { v: 1 },
                rr: { v: 3 },
                e33: { v: 2 },
            }, 'v')).toEqual({
                d: { v: 1 },
                e33: { v: 2 },
                rr: { v: 3 },
                a: { v: 4 }
            })


        })
    })

    describe('date', function () {
        var fn = avalon.filters.date

        it('test', function () {
            var format = 'yyyy MM dd'
            expect(fn(new Date('2014/4/1'), format)).toBe('2014 04 01')
            expect(fn('2011/07/08', format)).toBe('2011 07 08')
            expect(fn('2011-07-08', format)).toBe('2011 07 08')
            expect(fn('01-10-2000', format)).toBe('2000 01 10')
            expect(fn('07 04,2000', format)).toBe('2000 07 04')
            expect(fn('3 14,2000', format)).toBe('2000 03 14')
            expect(fn('1373021259229', format)).toBe('2013 07 05')
            expect(fn('2014-06-10T15:21:2', format)).toBe('2014 06 10')
            expect(fn('2014-12-07T22:50:58.33+08:00', format)).toBe('2014 12 07')
            expect(fn('2015-01-31 00:00:00', 'yyyy-MM-dd')).toBe('2015-01-31')
            expect(fn('\/Date(1216796600500)\/', 'yyyy-MM-dd')).toBe('2008-07-23')
            expect(fn(1373021259229, format)).toBe('2013 07 05')

            expect(fn(new Date('2014/4/1'), 'yyyy MM dd')).toBe('2014 04 01')
            expect(fn('1373021259229', 'yyyy MM dd')).toBe('2013 07 05')
            expect(fn(1373021259229, 'yyyy MM dd')).toBe('2013 07 05')
            expect(fn('2014-12-07T22:50:58+08:00', 'yyyy MM dd')).toBe('2014 12 07')
            expect(fn('\/Date(1373021259229)\/', 'yyyy MM dd')).toBe('2013 07 05')

        })

        it('EEE', function () {
            var date = new Date(2016, 7, 26)
            expect(fn(date, 'EEEE')).toBe('星期五')
            expect(fn(date, 'EEE')).toBe('周五')
            expect(fn(date, 'MMMM')).toBe('8月')
            expect(fn(date, 'MMM')).toBe('8月')
        })

        it('Z', function () {
            var date = new Date(2016, 7, 26)
            expect(fn(date, 'Z')).toMatch(/(-|\+)\d+/)
        })

        it('shortName', function () {
            var date = new Date(2016, 7, 26, 12, 4, 5)
            expect(fn(date)).toBe('2016-8-26')
            expect(fn(date, 'medium')).toBe('2016-8-26 12:04:05')
            expect(fn(date, 'short')).toBe('16-8-26 下午12:04')
            expect(fn(date, 'fullDate')).toBe('2016年8月26日星期五')
            expect(fn(date, 'yyyy-MM-dd a')).toBe('2016-08-26 下午')
            date = new Date(2016, 7, 26, 8, 4, 5)
            expect(fn(date, 'yyyy-MM-dd a')).toBe('2016-08-26 上午')

        })


    })
    describe('事件过滤器', function () {

        it("$return", function () {
            var fn = avalon.filters.enter
            var e = { which: 11 }
            fn(e)
            expect(e.$return).toBe(true)
            var e = { which: 13 }
            fn(e)
            expect(e.$return).toBe(void 0)
        })

        it('stop and prevent', function () {
            var e = {
                stopPropagation: function () { },
                preventDefault: function () { }
            }
            spyOn(e, 'stopPropagation')
            spyOn(e, 'preventDefault')
            avalon.filters.stop(e)
            avalon.filters.prevent(e)
            expect(e.stopPropagation).toHaveBeenCalled()
            expect(e.preventDefault).toHaveBeenCalled()

        })
    })

})