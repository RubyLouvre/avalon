// Generated on Sun Feb 21 2016 14:19:52 GMT+1100 (AEDT)


module.exports = function(config) {

        var options = {

            // base path that will be used to resolve all patterns (eg. files, exclude)
            basePath: '',

            // frameworks to use
            // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
            frameworks: ['jasmine'], //jasmine


            // list of files / patterns to load in the browser
            files: [
                './test/promise.js',
                './test/matchers.js',
                './test/beforeIt.js',
                './test/jquery.js',
                './dist/avalon.test.js'
            ],


            // list of files to exclude
            exclude: [],


            // preprocess matching files before serving them to the browser
            // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor


            // test results reporter to use
            // possible values: 'dots', 'progress'
            // available reporters: https://npmjs.org/browse/keyword/karma-reporter
            reporters: ['spec', 'coverage'],



            // web server port
            port: 9876,


            // enable / disable colors in the output (reporters and logs)
            colors: true,


            // level of logging
            // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
            logLevel: config.LOG_INFO,


            // enable / disable watching file and executing tests whenever any file changes
            autoWatch: true,


            // start these browsers
            // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
            browsers: ['Chrome', 'PhantomJS', 'Firefox'], //['Chrome', 'PhantomJS', 'Firefox''IE','Firefox', 'IE7','Chrome','Chrome', 'PhantomJS_custom',

            customLaunchers: {
                IE6: {
                    base: 'IE',
                    flags: ['-extoff'],
                    'x-ua-compatible': 'IE=5'
                },
                IE8: {
                    base: 'IE',
                    flags: ['-extoff'],
                    'x-ua-compatible': 'IE=8'
                },
                IE10: {
                    base: 'IE',
                    flags: ['-extoff'],
                    'x-ua-compatible': 'IE=EmulateIE10'
                },
                IE9: {
                    base: 'IE',
                    flags: ['-extoff'],
                    'x-ua-compatible': 'IE=EmulateIE9'
                },
                'PhantomJS_custom': {
                    base: 'PhantomJS',
                    options: {
                        windowName: 'my-window',
                        settings: {
                            webSecurityEnabled: false
                        },
                    },
                    flags: ['--load-images=false'],
                    debug: true
                }
            },
            coverageReporter: {
                reporters: [
                    { type: 'text-summary', subdir: '.' },
                    { type: 'lcov', subdir: '.', dir: 'coverage/' }
                ]

            },
            // Continuous Integration mode
            // if true, Karma captures browsers, runs the tests and exits
            singleRun: true,


            // webpack: require('./webpack.config.js'),

            webpackServer: {
                noInfo: true //please don't spam the console when running in karma!
            }

        }
        if (process.env.TRAVIS) {
            options.customLaunchers = {
                Chrome_travis_ci: {
                    base: 'Chrome',
                    flags: ['--no-sandbox']
                },
                'PhantomJS_custom': {
                    base: 'PhantomJS',
                    options: {
                        windowName: 'my-window',
                        settings: {
                            webSecurityEnabled: false
                        },
                    },
                    flags: ['--load-images=false'],
                    debug: true
                }
            };
            options.browsers = [
                "Chrome_travis_ci",
                "Firefox",
                //"IE",
                //"Opera",
                "PhantomJS_custom"
            ];
        }
        config.set(options);

    }
    //在travis-ci环境中跑 Chrome
    //http://stackoverflow.com/questions/19255976/how-to-make-travis-execute-angular-tests-on-chrome-please-set-env-variable-chr