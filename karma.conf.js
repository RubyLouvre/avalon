module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['mocha'],
        files: [
            {pattern: 'node_modules/chai/chai.js', include: true},
            'dist/avalon.js',
            'karma/directives.js',
            'karma/duplex.js'
        ],
        exclude: [],
        reporters: ['mocha'],
        mochaReporter: {
            output: 'autowatch',
            colors: {
                success: 'green',
                info: 'magenta',
                warning: 'cyan',
                error: 'bgRed'
            }
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
//autoWatch为true,Karma将自动执行测试用例
        autoWatch: true,
//http://www.cnblogs.com/NetSos/p/4371075.html
        browsers: ['Chrome'],
        singleRun: false,
        plugins: [
            'karma-mocha',
            'karma-mocha-reporter',
            'karma-firefox-launcher',
            'karma-chrome-launcher',
            'karma-opera-launcher',
            'karma-safari-launcher'
        ]
    })
}