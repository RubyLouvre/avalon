var rollup = require('rollup');
var fs = require('fs');
var istanbul = require('rollup-plugin-istanbul');
var babel = require("babel-core");
var less = require('semicolon-less')

// used to track the cache for subsequent bundles
var cache;

module.exports = rollup.rollup({
    // The bundle's starting point. This file will be
    // included, along with the minimum necessary code
    // from its dependencies
    entry: 'test/spec.modern.js',
    // If you have a bundle you want to re-use (e.g., when using a watcher to rebuild as files change),
    // you can tell rollup use a previous bundle as its starting point.
    // This is entirely optional!
    cache: cache,

    plugins: [
        // istanbul({
        //   exclude: ['test/**/*.js']
        // })
    ]
}).then(function(bundle) {
    // Generate bundle + sourcemap
    var result = bundle.generate({
        format: 'umd',
        moduleName: 'avalon'
    });
    // Cache our bundle for later use (optional)
    cache = bundle;
    var code = result.code.replace(
            /Object\.defineProperty\(exports,\s*'__esModule',\s*\{\s*value:\s*true\s*\}\);/,
            "exports.__esModule = true").
        //      replace(/'use strict';?/,'')
    replace(/avalon\$1/g, 'avalon')

    result = babel.transform(code, {
        presets: ['avalon'],
        compact: false
    })

    code = result.code.replace(/\}\)\(undefined,/, '})(this,')
    fs.writeFileSync('./dist/avalon.modern.test.js', less(code));

}).catch(function(e) {
    console.log('error', e)
})