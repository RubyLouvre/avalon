var expect = require('chai').expect
var avalon = require('./index')
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
        it('test', function () {
            expect(fn('<s>a</s>')).to.equal('&lt;s&gt;a&lt;/s&gt;')
        })
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
            expect(fn(1111111111)).to.equal('1,111,111,111.000')
            expect(fn(1111111111, 2, '.', '-')).to.equal('1-111-111-111.00')
        })
    })

    describe('truncate', function () {
        var fn = avalon.filters.truncate
        it('test', function () {
            expect(fn('大跃进大发展', 5, '***')).to.equal('大跃***')
        })
    })

    describe('filterBy', function () {
        var fn = avalon.filters.filterBy
        it('test', function () {
            var array = fn(['aaa', 'bbaa', 'ccc', 'daad'], 'aa')
            delete array.$id
            delete array.$hashcode

            expect(array).to.eql(['aaa', 'bbaa', 'daad'])
        })
    })
    describe('limitBy', function () {
        var items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
                str = 'tuvwxyz',
                number = 100.045;
        var fn = avalon.filters.limitBy
        var limitTo = fn
        it('test', function () {
            expect(fn(items, 3)).to.eql(['a', 'b', 'c']);
            expect(fn(items, '3')).to.eql(['a', 'b', 'c']);
           
           
        })


        it('should return the first X items beginning from index Y when X and Y are positive', function () {
            expect(limitTo(items, 3, '3')).to.eql(['d', 'e', 'f']);
            expect(limitTo(items, '3', 3)).to.eql(['d', 'e', 'f']);
          
        });

        it('should return the first X items beginning from index Y when X is positive and Y is negative', function () {
            expect(limitTo(items, 3, '-3')).to.eql(['f', 'g', 'h']);
            expect(limitTo(items, '3', -3)).to.eql(['f', 'g', 'h']);
           
        });

        it('should return the last X items when X is negative', function () {
            expect(limitTo(items, -3)).to.eql(['f', 'g', 'h']);
            expect(limitTo(items, '-3')).to.eql(['f', 'g', 'h']);
          
           
        });

        it('should return the last X items until index Y when X and Y are negative', function () {
            expect(limitTo(items, -3, '-3')).to.eql(['c', 'd', 'e']);
            expect(limitTo(items, '-3', -3)).to.eql(['c', 'd', 'e']);
           
        });

        it('should return the last X items until index Y when X is negative and Y is positive', function () {
            expect(limitTo(items, -3, '4')).to.eql(['b', 'c', 'd']);
            expect(limitTo(items, '-3', 4)).to.eql(['b', 'c', 'd']);
           
        });

        it('should return an empty array when X = 0', function () {
            expect(limitTo(items, 0)).to.eql([]);
            expect(limitTo(items, '0')).to.eql([]);
        });

        it('should return entire array when X cannot be parsed', function () {
            expect(limitTo(items, 'bogus')).to.eql(items);
            expect(limitTo(items, 'null')).to.eql(items);
            expect(limitTo(items, 'undefined')).to.eql(items);
            expect(limitTo(items, null)).to.eql(items);
            expect(limitTo(items, undefined)).to.eql(items);
        });

      

        it('should take 0 as beginning index value when Y cannot be parsed', function () {
            expect(limitTo(items, 3, 'bogus')).to.eql(limitTo(items, 3, 0));
            expect(limitTo(items, -3, 'null')).to.eql(limitTo(items, -3));
            expect(limitTo(items, '3', 'undefined')).to.eql(limitTo(items, '3', 0));
            expect(limitTo(items, '-3', null)).to.eql(limitTo(items, '-3'));
            expect(limitTo(items, 3, undefined)).to.eql(limitTo(items, 3, 0));
          
        });

        it('should return input if not String or Array or Number', function () {
           
            expect(limitTo({}, 1)).to.eql({});
        });
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
            expect(fn('2014-12-07T22:50:58+08:00', format)).to.equal('2014 12 07:22:50:58')
            expect(fn('2015-01-31 00:00:00', 'yyyy-MM-dd')).to.equal('2015-01-31')
            expect(fn('\/Date(1216796600500)\/', 'yyyy-MM-dd')).to.equal('2008-07-23')
            expect(fn(1373021259229, format)).to.equal('2013 07 05:18:47:39')
        })

        it('test2', function () {

            expect(fn(new Date('2014/4/1'), 'yyyy MM dd:HH:mm:ss')).to.equal('2014 04 01:00:00:00')
            expect(fn('1373021259229', 'yyyy MM dd:HH:mm:ss')).to.equal('2013 07 05:18:47:39')
            expect(fn(1373021259229, 'yyyy MM dd:HH:mm:ss')).to.equal('2013 07 05:18:47:39')
            expect(fn('2014-12-07T22:50:58+08:00', 'yyyy MM dd:HH:mm:ss')).to.equal('2014 12 07:22:50:58')
            expect(fn('\/Date(1373021259229)\/', 'yyyy MM dd:HH:mm:ss')).to.equal('2013 07 05:18:47:39')

        })
    })



})

