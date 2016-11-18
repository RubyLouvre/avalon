import { avalon, isArrayLike } from '../../src/seed/lang.modern'

describe('seed/lang', function () {

    it('quote', function () {

        expect(avalon.quote).toA('function')
        expect(avalon.quote('1')).toBe('"1"')
        expect(avalon.quote('foo\nbar\r\nbaz')).toBe('"foo\\nbar\\r\\nbaz"')
     
    })

    it('type', function () {

        var fn = avalon.type
        expect(fn(/e\d+/)).toEqual('regexp')
        expect(fn('sss')).toEqual('string')
        expect(fn(111)).toEqual('number')
        expect(fn(new Error)).toEqual('error')
        expect(fn(Date)).toEqual('function')
        expect(fn(new Date)).toEqual('date')
        expect(fn({})).toEqual('object')
        expect(fn(null)).toEqual('null')
        expect(fn(void 0)).toEqual('undefined')

    })

    it('isFunction', function () {

        expect(avalon.isFunction(avalon.noop)).toEqual(true)

    })

    it('isWindow', function () {

        expect(avalon.isWindow(avalon.document)).toEqual(false)
        expect(avalon.isWindow(window)).toBeTruthy()

    })
    

    it('isPlainObject', function () {

        expect(avalon.isPlainObject({})).toBeTruthy()
        expect(avalon.isPlainObject(new Object)).toBeTruthy()


        var pass, doc, parentObj, childObj, deep,
            fn = function () { };

        // The use case that we want to match
        expect(avalon.isPlainObject({})).toBeTruthy()
        expect(avalon.isPlainObject(new window.Object())).toBeTruthy()
        expect(avalon.isPlainObject({ constructor: fn })).toBeTruthy()
        expect(avalon.isPlainObject({ constructor: "foo" })).toBeTruthy()

       
        // Not objects shouldn't be matched
        expect(!avalon.isPlainObject("")).toBeTruthy()
        expect(!avalon.isPlainObject(0) && !avalon.isPlainObject(1)).toBeTruthy()
        expect(!avalon.isPlainObject(true) && !avalon.isPlainObject(false)).toBeTruthy()
        expect(!avalon.isPlainObject(null)).toBeTruthy()
        expect(!avalon.isPlainObject(undefined)).toBeTruthy()

        // Arrays shouldn't be matched
        expect(!avalon.isPlainObject([])).toBeTruthy()

        // Instantiated objects shouldn't be matched
        expect(!avalon.isPlainObject(new Date())).toBeTruthy()

        // Functions shouldn't be matched
        expect(!avalon.isPlainObject(fn)).toBeTruthy()

        // Again, instantiated objects shouldn't be matched
        expect(!avalon.isPlainObject(new fn())).toBeTruthy()

        // Makes the function a little more realistic
        // (and harder to detect, incidentally)
        fn.prototype["someMethod"] = function () { };

        // Again, instantiated objects shouldn't be matched
        expect(!avalon.isPlainObject(new fn())).toBeTruthy()

        // Instantiated objects with primitive constructors shouldn't be matched
        fn.prototype.constructor = "foo";
        expect(!avalon.isPlainObject(new fn())).toBeTruthy()

        // Deep object
        deep = { "foo": { "baz": true }, "foo2": document }
        expect(avalon.isPlainObject(deep)).toBeTruthy()

        // DOM Element
        expect(!avalon.isPlainObject(document.createElement("div"))).toBeTruthy()

        // Window
        expect(!avalon.isPlainObject(window)).toBeTruthy()

       

    })

    it('mix', function () {

        expect(avalon.mix).toA('function')
        expect(avalon.mix('aaa', {a: 1})).toEqual({a: 1})
        var empty, optionsWithLength, optionsWithDate, myKlass,
            customObject, optionsWithCustomObject, MyNumber, ret,
            nullUndef, target, recursive, obj,
            defaults, defaultsCopy, options1, options1Copy, options2, options2Copy, merged2,
            settings = { "xnumber1": 5, "xnumber2": 7, "xstring1": "peter", "xstring2": "pan" },
            options = { "xnumber2": 1, "xstring2": "x", "xxx": "newstring" },
            optionsCopy = { "xnumber2": 1, "xstring2": "x", "xxx": "newstring" },
            merged = { "xnumber1": 5, "xnumber2": 1, "xstring1": "peter", "xstring2": "x", "xxx": "newstring" },
            deep1 = { "foo": { "bar": true } },
            deep2 = { "foo": { "baz": true }, "foo2": document },
            deep2copy = { "foo": { "baz": true }, "foo2": document },
            deepmerged = { "foo": { "bar": true, "baz": true }, "foo2": document },
            arr = [1, 2, 3],
            nestedarray = { "arr": arr }

        avalon.mix(settings, options)
        expect(settings).toEqual(merged)
        expect(options).toEqual(optionsCopy)


        avalon.mix(settings, null, void 0, options)
        expect(settings).toEqual(merged)
        expect(options).toEqual(optionsCopy)

        avalon.mix(true, deep1, deep2);
        expect(deep1["foo"]).toEqual(deepmerged["foo"])
        expect(deep2["foo"]).toEqual(deep2copy["foo"])
        expect(deep1["foo2"]).toBe(document)

        expect(avalon.mix(true, {}, nestedarray)["arr"]).not.toBe(arr)
        var circulate = {}
        var child = { a: circulate }
        expect(avalon.mix(circulate, child, { a: 1 })).toEqual({ a: 1 })
        avalon.mix({ testA: 1 }) //将数据加在它上面
        expect(avalon.testA).toEqual(1)
        delete avalon.testA
        // ???
        //        var testA = {testA: 1}
        //        avalon.mix(testA, 'string') //当参数为其他简单类型 
        //        expect(testA ).toEqual( {testA: 1} ) 


        // deep copy with array, followed by object
        var result, initial = {

            // This will make "copyIsArray" true
            array: [1, 2, 3, 4],

            // If "copyIsArray" doesn't get reset to false, the check
            // will evaluate true and enter the array copy block
            // instead of the object copy block. Since the ternary in the
            // "copyIsArray" block will evaluate to false
            // (check if operating on an array with ), this will be
            // replaced by an empty array.
            object: {}
        }
        result = avalon.mix(true, {}, initial)
//IE8  会完蛋?
        expect(result.array).toEqual(initial.array)
        expect(!Array.isArray(result.object)).toBe(true)
    })

    it('each', function () {

        expect(avalon.each).toA('function')
        var array = []
        avalon.each({ a: 1, b: 2 }, function (k, v) {
            array.push(k, v)
        })
        expect(array.join(',')).toBe('a,1,b,2')
        var array2 = []
        avalon.each(['c', 'd'], function (k, v) {
            array2.push(k, v)
        })
        expect(array2.join(',')).toBe('0,c,1,d')

        var seen = []
        avalon.each([1, 2, 3], function (k, v) {
            seen.push(v);
            if (k === 1) {
                return false
            }
        });
        expect(seen).toEqual([1, 2])
        var seen2 = []
        avalon.each({ x: 11, y: 22, z: 33 }, function (k, v) {

            if (k === 'z') {
                return false
            }
            seen2.push(v)
        })
        expect(seen2).toEqual([11, 22])


    })

    it('isArrayLike', function () {

        expect(isArrayLike({
            0: 11,
            1: 11,
            length: 2
        })).toBeTruthy()

        expect(isArrayLike(arguments)).toBeTruthy()
        expect(!isArrayLike(null)).toBeTruthy()
        expect(!isArrayLike(undefined)).toBeTruthy()
        expect(!isArrayLike(true)).toBeTruthy()
        expect(!isArrayLike(false)).toBeTruthy()
        expect(!isArrayLike(function () { })).toBeTruthy()
        expect(!isArrayLike('')).toBeTruthy()
        expect(!isArrayLike('abc')).toBeTruthy()

    })

})