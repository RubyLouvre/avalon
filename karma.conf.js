module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['mocha'],
        files: [
            {pattern: 'node_modules/chai/chai.js', include: true},
            'dist/avalon.test.js',
            'karma/reconcile.js',
            'karma/directives/text.js',
            'karma/directives/controller.js',
            'karma/directives/expr.js',
            'karma/directives/class.js',
            'karma/directives/css.js',
            'karma/directives/attr.js',
            'karma/directives/html.js',
            'karma/directives/visible.js',
            'karma/directives/if.js',
            'karma/directives/on.js',
            'karma/directives/duplex.js',
            'karma/directives/for.js',
            'karma/directives/widget.js'
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

//使用 karma start