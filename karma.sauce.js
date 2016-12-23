var fs = require('fs');
// karma start karma.sauce
module.exports = function(config) {

    // Use ENV vars on Travis and sauce.json locally to get credentials
    if (process.env.SAUCE_USERNAME) {
        console.log('使用全局的sauce key')
    } else {
        if (!fs.existsSync('sauce.json')) {
            console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
            process.exit(1);
        } else {
            console.log('使用sauce.json!')
            process.env.SAUCE_USERNAME = require('./sauce').username;
            process.env.SAUCE_ACCESS_KEY = require('./sauce').accessKey;
        }
    }
    // https://saucelabs.com/platforms
    // Browsers to run on Sauce Labs
    function createCustomLauncher(browser, platform, version) {
        if (browser === 'IE') {
            browser = 'internet explorer'
        }
        if (browser === 'iphone') {
            if (platform === null) {
                platform = '1.5.3'
            }
            return {
                base: "SauceLabs",
                browserName: "iphone",
                platform: platform,
                version: version,
                "device-orientation": "portrait"
            }
        }
        return {
            base: 'SauceLabs',
            browserName: browser,
            platform: platform,
            version: version
        };
    }
    var customLaunchers = {
        sl_win_ie_10: createCustomLauncher('IE', 'Windows 8', '10'),

        sl_win_ie_8: createCustomLauncher('IE', 'Windows XP', '8'),

        sl_win_ie_9: createCustomLauncher('IE', 'Windows 2008', '9'),



        sl_win_ie_11: createCustomLauncher('IE', 'Windows 8.1', '11'),



        sl_edge_13: createCustomLauncher('MicrosoftEdge', 'Windows 10', '13'),

        chrome55: createCustomLauncher('chrome', 'OS X 10.10', '55.0'),


        chrome45: createCustomLauncher('chrome', 'OS X 10.8', '45.0'),

        chrome30: createCustomLauncher('chrome', 'Windows 7', '30.0'),
        sl_edge_14: createCustomLauncher('MicrosoftEdge', 'Windows 10', '14'),
        sl_win_ie_7: createCustomLauncher('IE', 'Windows XP', '7'),

        firefox20: createCustomLauncher('firefox', 'Windows XP', '20.0'),

        firefox40: createCustomLauncher('firefox', 'Windows 8', '40.0'),

        firefox50: createCustomLauncher('firefox', 'OS X 10.9', '50.0'),

        //chrome最低只支持到26

        // Safari (last 2 versions)

        sl_safari9: createCustomLauncher('safari', 'OS X 10.11', '9'),

        sl_safari8: createCustomLauncher('safari', 'OS X 10.10', '8'),

        sl_safari7: createCustomLauncher('safari', 'OS X 10.9', '7'),

        sl_android_4_0: createCustomLauncher('android', null, '4.0'),
        sl_android_4_4: createCustomLauncher('android', null, '4.4'),

        sl_android_5_1: createCustomLauncher('android', null, '5.1'),

        // iOS (last 2 major versions)
        sl_ios9_iphone: {
            base: 'SauceLabs',
            browserName: 'iphone',
            platform: 'OS X 10.10',
            version: '9.2',
        },
        sl_ios8_iphone: {
            base: 'SauceLabs',
            browserName: 'iphone',
            platform: 'OS X 10.10',
            version: '8.4',
        },


    };
    //https://github.com/karma-runner/karma-sauce-launcher/issues/61
    // https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/   
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [
            './test/promise.js',
            './test/matchers.js',
            './test/beforeIt.js',
            './test/jquery.js',
            './dist/avalon.sauce.js'
        ],


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['dots', 'saucelabs'],


        // web server port
        port: 9876,

        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,
        retryLimit: 10, //为了保证都能运行这么多浏览器，必须添加重起的次数
        sauceLabs: {
            testName: '加大mac测试',
            //recordScreenshots: false,
            connectOptions: {
                port: 5757,
                logfile: 'sauce_connect.log'
            },
            public: 'public'
        },
        captureTimeout: 160000,
        customLaunchers: customLaunchers,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: Object.keys(customLaunchers),
        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};