var fs = require('fs');
// karma start karma.sauce
module.exports = function(config) {

    // Use ENV vars on Travis and sauce.json locally to get credentials
    if (!process.env.SAUCE_USERNAME) {
        if (!fs.existsSync('sauce.json')) {
            console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
            process.exit(1);
        } else {
            process.env.SAUCE_USERNAME = require('./sauce').username;
            process.env.SAUCE_ACCESS_KEY = require('./sauce').accessKey;
        }
    }
    // https://saucelabs.com/platforms
    // Browsers to run on Sauce Labs
    var customLaunchers = {
        'SL_Chrome': {
            base: 'SauceLabs',
            browserName: 'chrome'
        },
        'Firefox26': {
            base: 'SauceLabs',
            browserName: 'firefox',
            version: '26'
        },
        // 'Firefox4': {
        //      base: 'SauceLabs',
        //      browserName: 'firefox',
        //      version: '4'
        //  }
        //    SL_IE_7: {
        //             base: 'SauceLabs',
        //             browserName: 'internet explorer',
        //             version: '7',
        //             platform: 'Windows XP'
        //
        //    },
        'SL_IE_9': {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 2008',
            version: '9'
        },
        'SL_IE_10': {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 2012',
            version: '10'
        },
        'SL_IE_11': {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 8.1',
            version: '11'
        }
    };

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
            './dist/avalon.test.js'
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

        sauceLabs: {
            testName: 'ie7-11',
            //recordScreenshots: false,
            connectOptions: {
                port: 5757,
                logfile: 'sauce_connect.log'
            },
            public: 'public'
        },
        captureTimeout: 120000,
        customLaunchers: customLaunchers,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: Object.keys(customLaunchers),
        singleRun: true
    });
};