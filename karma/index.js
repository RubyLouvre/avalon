
/**
 * Created with IntelliJ IDEA.
 * User: shenyanchao
 * Date: 3/5/13
 * Time: 5:51 PM
 * To change this template use File | Settings | File Templates.
 */

var assert = chai.assert;
var expect = chai.expect

describe('Array', function () {


    describe('#indexOf()', function () {

        it('test', function () {
            assert.equal(-1, [1, 2, 3].indexOf(5));
            assert.equal(-1, [1, 2, 3].indexOf(0));
        });
    });


    describe('#Array.isArray', function () {

        it('test', function () {
            expect(Array.isArray(5)).to.equal(false)
            expect(Array.isArray([])).to.equal(true)
        });


    });
    describe('#isWindow', function () {

        it('test', function () {
            expect(window.window).to.equal(window)
            expect(typeof window.location).to.equal("object")
            expect(typeof window.setTimeout).to.equal("function")

        });


    });
})