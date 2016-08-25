describe('测试config文件的API', function () {
    describe('config', function () {
        it('test', function () {
            expect(avalon.config).to.be.a('function')
            expect(avalon.config).to.have.all.keys(
                    [
                        'openTag', 'closeTag', 'rexpr', 'plugins', 'debug'
                    ])
            expect(avalon.config.openTag).to.equal('{{')
            expect(avalon.config.closeTag).to.equal('}}')
            expect(avalon.config.plugins.interpolate).to.be.a('function')
        })
    })
})
