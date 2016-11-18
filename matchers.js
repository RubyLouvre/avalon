
if (typeof jasmine !== 'undefined') {
  // http://stackoverflow.com/questions/11942085/is-there-a-way-to-add-a-jasmine-matcher-to-the-whole-environment
  beforeEach(function () {

    jasmine.addMatchers({
      toHaveKeys: function () {
        return {
          compare: function (actual, expected) {
            var keys = {}
            for (var i in actual) {
              try {
                keys[i] = true
              } catch (e) { }
            }
            for (var i = 0; i < expected.length; i++) {
              var el = expected[i]
              if (keys[el] !== true) {
                return {
                  message: 'toHaveKeys has not this [' + el + '] key',
                  pass: false
                }
              }
            }
            return {
              pass: true
            }
          }
        }
      },
      toInstanceOf: function () {
        return {
          compare: function (actual, expected) {
            var pass = actual instanceof expected

            if (!pass) {
              return {
                message: 'toInstanceOf expected [' + expected + '], but is not',
                pass: false
              }
            }

            return {
              pass: true
            }
          }
        }
      },
      toHaveProperty: function () {
        return {
          compare: function (actual, expected) {
            var ohas = Object.prototype.hasOwnProperty
            var pass = ohas.call(actual, expected)
            if (!pass) {
              return {
                message: 'toHaveProperty expected has [' + expected + '] property, but is not',
                pass: false
              }
            }

            return {
              pass: true
            }
          }
        }
      },
      toA: function () {
        return {
          compare: function (actual, expected) {
            if (actual == null) {
              var type = actual + ''
            } else {
              var toS = Object.prototype.toString
              type = toS.call(actual).slice(8, -1).toLowerCase()
            }
            if (/error$/.test(type)) {
              type = 'error' //IE对错误类型存在差异,因此统一为Error
            }

            if (type !== expected) {
              return {
                message: 'Expected [' + expected + '] but actual is ' + type + '!',
                pass: false
              }
            }
            return {
              pass: true
            }
          }
        }
      }
    })
  })
}
