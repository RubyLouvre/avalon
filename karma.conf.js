
module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['mocha'],
        files: [
            //  {pattern: 'node_modules/sinon/chai.js', include: true},
            {pattern: 'node_modules/chai/chai.js', include: true},
            {pattern: 'node_modules/sinon/pkg/sinon.js', include: true},
            'dist/avalon.test.js',
            // 'karma/reconcile.js',
            'karma/seed/core.js',
            'karma/seed/browser.js',
            'karma/seed/lang.js',
            'karma/seed/cache.js',
            'karma/seed/config.js',
            'karma/filters/index.js',
            'karma/vdom/index.js',
              
            'karma/$watch.js',
            'karma/other.js',
            'karma/directives/text.js',
            'karma/directives/controller.js',
            'karma/directives/expr.js',
            'karma/directives/effect.js',
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
        mochaReporter: {
            output: 'autowatch',
            colors: {
                success: 'green',
                info: 'magenta',
                warning: 'cyan',
                error: 'bgRed'
            }
        },
        reporters: ['mocha', 'coverage'],
        preprocessors: {
            // source files, that you wanna generate coverage for
            // do not include tests or libraries
            // (these files will be instrumented by Istanbul)
            'dist/avalon.test.js': ['coverage']
        },
        coverageReporter: {
            type: 'html',
            dir: 'coverage/'
        },
        port: 9858,
        colors: true,
        logLevel: config.LOG_INFO,
//autoWatch为true,Karma将自动执行测试用例
        autoWatch: true,
//http://www.cnblogs.com/NetSos/p/4371075.html
        browsers: ['Chrome'],
        singleRun: false,
        plugins: [
            'karma-mocha',
            'karma-sinon',
            'karma-coverage',
            'karma-mocha-reporter',
            'karma-firefox-launcher',
            'karma-safari-launcher',
            'karma-chrome-launcher',
            'karma-ie-launcher',
            'karma-opera-launcher',
            'karma-safari-launcher'
        ]
    })
}

//使用 karma start