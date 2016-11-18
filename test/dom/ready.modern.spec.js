import { avalon } from '../../src/seed/core'
import { fireReady } from '../../src/dom/ready/modern'


describe('ready', function () {
    it('isReady', function () {
      
        expect(avalon.isReady).toBe(true)
        var a = 1
        avalon.isReady = false
        avalon.ready(function () {
            a = 2
        })
        fireReady()
        expect(avalon.isReady).toBe(true)
        expect(a).toBe(2)
        
        avalon.ready(function () {
            a = 3
        })
        expect(a).toBe(3)
    })

})
