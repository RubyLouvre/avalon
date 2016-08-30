describe('filters', function () {

    describe('uppercase', function () {
        var fn = avalon.filters.uppercase
        it('test', function () {
            expect(fn('aaa')).to.equal('AAA')
        })
    })

    describe('lowercase', function () {
        var fn = avalon.filters.lowercase
        it('test', function () {
            expect(fn('AAA')).to.equal('aaa')
        })
    })

    describe('escape', function () {
        var fn = avalon.filters.escape
        it('escapes "&" to "&amp;"', function () {
            expect(fn('&')).to.equal('&amp;');
        });
        it('escapes "<" to "&lt;"', function () {
            expect(fn('<')).to.equal('&lt;');
        });
        it('escapes ">" to "&gt;"', function () {
            expect(fn('>')).to.equal('&gt;');
        });
        it('escapes \'"\' to "&quot;"', function () {
            expect(fn('"')).to.equal('&quot;');
        });
        it('escapes "\'" to "&#39;"', function () {
            expect(fn("'")).to.equal('&#39;');
        });
        it('escapes all special chars', function () {
            expect(fn("<&<&")).to.equal('&lt;&amp;&lt;&amp;');
        });
        it('returns an empty string for null', function () {
            expect(fn(null)).to.equal('');
        });
        it('returns an empty string for undefined', function () {
            expect(fn(null)).to.equal('');
        });
        it('stringify non-string value', function () {
            expect(fn(1)).to.equal('1');
        });
        it('returns "false" for false', function () {
            expect(fn(false)).to.equal('false');
        });
    })

    describe('sanitize', function () {
        it('test', function () {
            var str = '<a href="javascript:fix">SSS</a><img onclick=333 src=http://tp2.sinaimg.cn/1823438905/180/40054009869/1/><p onfocus="aaa" ontap="ddd" title=eee onkeypress=eee>onmousewheel=eee<span onmouseup="ddd">DDD</span></p><script>alert(1)<\/script>222222'
            var ret = avalon.filters.sanitize(str)
            expect(ret.indexOf('fix')).to.equal(-1)
            expect(ret.indexOf('onclick')).to.equal(-1)
            expect(ret.indexOf('ontap')).to.equal(-1)
            expect(ret.indexOf('onkeypress')).to.equal(-1)
            expect(ret.indexOf('onfocus')).to.equal(-1)
            expect(ret.indexOf('onmouseup')).to.equal(-1)
            expect(ret.indexOf('<script')).to.equal(-1)
            expect(ret.indexOf('onmousewheel')).not.to.equal(-1)
        })
    })
    describe('camelize', function () {
        var fn = avalon.filters.camelize
        it('test', function () {
            expect(fn('aa-bb')).to.equal('aaBb')
            expect(fn('aa_cb')).to.equal('aaCb')
        })
    })

    describe('number', function () {
        var fn = avalon.filters.number
        it('test', function () {
            expect(fn(1.234567, 1)).to.equal('1.2')
            expect(fn(1111111111)).to.equal('1,111,111,111.000')
            expect(fn(1111111111, 2, '.', '-')).to.equal('1-111-111-111.00')
        })
    })

    describe('truncate', function () {
        var fn = avalon.filters.truncate
        it('test', function () {
            expect(fn('大跃进大发展', 5, '***')).to.equal('大跃***')
            expect(fn('1122dsfdsfdsfdsfdffsfdsfewrewrw5')).to.equal('1122dsfdsfdsfdsfdffsfdsfewr...')
            expect(fn('1122dsfdsfdsfdsfdffsfdsfewrewrw5', -5)).to.equal('1122dsfdsfdsfdsfdffsfdsf...')
            expect(fn(null)).to.equal('')
            expect(fn('')).to.equal('')
        })
    })

    describe('currency', function () {
        var fn = avalon.filters.currency
        it('test', function () {
            expect(fn(2500)).to.equal('¥2,500.00')
            expect(fn(2500, 'RMB')).to.equal('RMB2,500.00')
        })
    })

    describe('avalon.__format__', function () {
        it('test', function () {
            var fn = avalon.filters.filterBy
            expect(avalon.__format__('filterBy')).to.equal(fn)
            expect(avalon.__format__('aaa4')).to.match(/return\s+a/)
        })
    })

    describe('filterBy', function () {
        var fn = avalon.filters.filterBy
        it('test', function () {

            try {
                fn(111)
            } catch (e) {
                expect(e).to.equal('filterBy只能处理对象或数组')
            }


            expect(fn(['aaa', 'bbaa', 'ccc', 'daad'], 'aa')).to.eql(['aaa', 'bbaa', 'daad'])
            expect(fn(['aaa', 'bbaa', 'ccc', 'ddd'], '')).to.eql(['aaa', 'bbaa', 'ccc', 'ddd'])
            expect(fn(['aa11', '1122', '66', '2113'], 11)).to.eql(['aa11', '1122', '2113'])
            expect(fn(['aaa', 'bbaa', 'ccc', 'ddd'], true)).to.eql(['aaa', 'bbaa', 'ccc', 'ddd'])

            expect(fn(['aa11', '1122', '66', '2113'], function (a) {
                return /2/.test(a)
            })).to.eql(['1122', '2113'])
            expect(fn({
                a: 111,
                b: 212,
                c: 332
            }, function (a) {
                return /2/.test(a)
            })).to.eql({
                b: 212,
                c: 332
            })

        })
    })
    describe('selectBy', function () {
        var fn = avalon.filters.selectBy
        it('test', function () {

            expect(fn('aaa', 'aa')).to.eql('aaa')
            expect(fn(['aaa', 'bbaa', 'ccc', 'ddd'], '')).to.eql(['aaa', 'bbaa', 'ccc', 'ddd'])
            expect(fn({
                aaa: 1,
                bbb: 2,
                ccc: 3
            }, ['aaa', 'bbb'])).to.eql([1, 2])
            expect(fn({
                aaa: 1,
                bbb: 2,
                ccc: 3
            }, ['aaa', 'bbb', 'ddd'], {ddd: 4})).to.eql([1, 2, 4])


        })
    })

    describe('limitBy', function () {
        var fn = avalon.filters.limitBy

        it('test', function () {
            try {
                fn(1111)
            } catch (e) {
                expect(e).to.eql('limitBy只能处理对象或数组');
            }
            expect(fn([11], 'ddd')).to.eql([11])
            expect(fn([11], NaN)).to.eql([11])
            expect(fn({a: 1, b: 2, c: 3}, 2)).to.eql({a: 1, b: 2})
            expect(fn([111, 222, 333, 444, 555], 2)).to.eql([111, 222])
            expect(fn([111, 222, 333, 444, 555], 7)).to.eql([111, 222, 333, 444, 555])
            expect(fn([111, 222, 333, 444, 555], 2, 2)).to.eql([333, 444])
            expect(fn([111, 222, 333, 444, 555, 666], 2, -2)).to.eql([555, 666])
            expect(fn([111, 222, 333, 444, 555, 666], 3.5)).to.eql([111, 222, 333])

        })
    })

    describe('orderBy', function () {
        var fn = avalon.filters.orderBy

        it('test', function () {
            try {
                fn(1111)
            } catch (e) {
                expect(e).to.eql('orderBy只能处理对象或数组');
            }
            expect(fn([{a: 1}, {a: 3}, {a: 2}, {a: 4}], 'a', 1)).to.eql([{a: 1}, {a: 2}, {a: 3}, {a: 4}])
            expect(fn([{a: 1}, {a: 3}, {a: 2}, {a: 4}], 'a', -1)).to.eql([{a: 4}, {a: 3}, {a: 2}, {a: 1}])
            expect(fn([{a: 1}, {a: NaN}, {a: 2}, {a: NaN}], 'a')).to.eql([{a: 1}, {a: NaN}, {a: 2}, {a: NaN}])


            expect(fn([111, 222, 33, 444, 5585], function (a) {
                return  String(a).length
            })).to.eql([33, 111, 222, 444, 5585])
            expect(fn({
                a: {v: 4},
                d: {v: 1},
                rr: {v: 3},
                e33: {v: 2},
            }, 'v')).to.eql({
                d: {v: 1},
                e33: {v: 2},
                rr: {v: 3},
                a: {v: 4}
            })


        })
    })

    describe('date', function () {
        var fn = avalon.filters.date

        it('test', function () {
            var format = 'yyyy MM dd:HH:mm:ss'
            expect(fn(new Date('2014/4/1'), format)).to.equal('2014 04 01:00:00:00')
            expect(fn('2011/07/08', format)).to.equal('2011 07 08:00:00:00')
            expect(fn('2011-07-08', format)).to.equal('2011 07 08:00:00:00')
            expect(fn('01-10-2000', format)).to.equal('2000 01 10:00:00:00')
            expect(fn('07 04,2000', format)).to.equal('2000 07 04:00:00:00')
            expect(fn('3 14,2000', format)).to.equal('2000 03 14:00:00:00')
            expect(fn('1373021259229', format)).to.equal('2013 07 05:18:47:39')
            expect(fn('2014-06-10T15:21:2', format)).to.equal('2014 06 10:15:21:02')
            expect(fn('2014-12-07T22:50:58.33+08:00', format)).to.equal('2014 12 07:22:50:58')
            expect(fn('2015-01-31 00:00:00', 'yyyy-MM-dd')).to.equal('2015-01-31')
            expect(fn('\/Date(1216796600500)\/', 'yyyy-MM-dd')).to.equal('2008-07-23')
            expect(fn(1373021259229, format)).to.equal('2013 07 05:18:47:39')

            expect(fn(new Date('2014/4/1'), 'yyyy MM dd:HH:mm:ss')).to.equal('2014 04 01:00:00:00')
            expect(fn('1373021259229', 'yyyy MM dd:HH:mm:ss')).to.equal('2013 07 05:18:47:39')
            expect(fn(1373021259229, 'yyyy MM dd:HH:mm:ss')).to.equal('2013 07 05:18:47:39')
            expect(fn('2014-12-07T22:50:58+08:00', 'yyyy MM dd:HH:mm:ss')).to.equal('2014 12 07:22:50:58')
            expect(fn('\/Date(1373021259229)\/', 'yyyy MM dd:HH:mm:ss')).to.equal('2013 07 05:18:47:39')

        })

        it('EEE', function () {
            var date = new Date(2016, 7, 26)
            expect(fn(date, 'EEEE')).to.equal('星期五')
            expect(fn(date, 'EEE')).to.equal('周五')
            expect(fn(date, 'MMMM')).to.equal('8月')
            expect(fn(date, 'MMM')).to.equal('8月')
        })

        it('Z', function () {
            var date = new Date(2016, 7, 26)
            expect(fn(date, 'Z')).to.equal('+0800')
        })

        it('shortName', function () {
            var date = new Date(2016, 7, 26, 12, 4, 5)
            expect(fn(date)).to.equal('2016-8-26')
            expect(fn(date, 'medium')).to.equal('2016-8-26 12:04:05')
            expect(fn(date, 'short')).to.equal('16-8-26 下午12:04')
            expect(fn(date, 'fullDate')).to.equal('2016年8月26日星期五')
            expect(fn(date, 'yyyy-MM-dd a')).to.equal('2016-08-26 下午')
            date = new Date(2016, 7, 26, 8, 4, 5)
            expect(fn(date, 'yyyy-MM-dd a')).to.equal('2016-08-26 上午')

        })


    })
    describe('事件过滤器', function () {

        it("$return", function () {
            var fn = avalon.filters.enter
            var e = {which: 11}
            fn(e)
            expect(e.$return).to.equal(true)
            var e = {which: 13}
            fn(e)
            expect(e.$return).to.equal(void 0)
        })

        it('stop and prevent', function () {
            var e = {
                stopPropagation: sinon.spy(),
                preventDefault: sinon.spy()
            }
            avalon.filters.stop(e)
            avalon.filters.prevent(e)
            expect(e.stopPropagation.called).to.equal(true)
            expect(e.preventDefault.called).to.equal(true)

        })
    })

})

