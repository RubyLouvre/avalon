import  {avalon}  from '../../src/seed/core'
describe('seed/browser', function () {

    it('browser', function () {
        expect(avalon).toHaveKeys(['window', 'document',
            'root', 'msie', 'modern', 'inBrowser'])
    })
})