var rollup = require('rollup');
var fs = require('fs');
var less = require('semicolon-less')

var istanbul = require('rollup-plugin-istanbul');
//var babel = require('rollup-plugin-babel');
var babel = require("babel-core");

var transform = require('es3ify').transform;

// used to track the cache for subsequent bundles
var cache;

module.exports = rollup.rollup({

    entry: 'test/spec.js',

    cache: cache,

    plugins: [
        istanbul({
            exclude: ['test/**/*.js']
        })
    ]
}).then(function(bundle) {
    // Generate bundle + sourcemap
    var result = bundle.generate({
        format: 'umd',
        moduleName: 'avalon'
    });
    // Cache our bundle for later use (optional)
    cache = bundle;
    result.code = result.code.replace(
            /Object\.defineProperty\(exports,\s*'__esModule',\s*\{\s*value:\s*true\s*\}\);/,
            "exports.__esModule = true").
        // replace(/'use strict';?/, '').
    replace(/avalon\$1/g, 'avalon')

    result = babel.transform(result.code, {
        presets: ['avalon'],
        compact: false
    })

    var code = transform(result.code).replace(/\}\)\(undefined,/, '})(this,')
    fs.writeFileSync('./dist/avalon.test.js', less(code));

}).catch(function(e) {
    console.log('error', e)
})