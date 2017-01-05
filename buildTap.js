var rollup = require('rollup');
var fs = require('fs');
var babel = require("babel-core");
var transform = require('es3ify').transform;
var less = function(a) { return a } //require('semicolon-less')

// used to track the cache for subsequent bundles
var cache;
var json = require('./package.json')
var v = 'version:' + JSON.stringify(json.version)
var sourcemaps = require('rollup-plugin-sourcemaps')

module.exports = rollup.rollup({
    // The bundle's starting point. This file will be
    // included, along with the minimum necessary code
    // from its dependencies

    entry: 'src/avalon.tap.js',
    // If you have a bundle you want to re-use (e.g., when using a watcher to rebuild as files change),
    // you can tell rollup use a previous bundle as its starting point.
    // This is entirely optional!
    cache: cache,

    plugins: [
        sourcemaps()
    ]
}).then(function(bundle) {
    // Generate bundle + sourcemap
    var result = bundle.generate({
        sourceMap: true,
        format: 'umd',
        moduleName: 'avalon'
    });
    // Cache our bundle for later use (optional)
    cache = bundle;
    result.code = result.code.replace(
        /Object\.defineProperty\(exports,\s*'__esModule',\s*\{\s*value:\s*true\s*\}\);/,
        "exports.__esModule = true").

    replace(/version\:\s*1/, v)


    result = babel.transform(result.code, {
        presets: ['avalon'],
        compact: false
    })

    function heredoc(fn) {
        return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
        replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
    }
    var feather = heredoc(function() {
        /*
这是合并了tap的avalon

修正IE下 orderBy BUG
更改下载Promise的提示
修复avalon.modern 在Proxy 模式下使用ms-for 循环对象时出错的BUG
修复effect内部传参 BUG
重构ms-validate的绑定事件的机制     
      
*/
    })
    var now = new Date
    var snow = now.getFullYear() + '-' + (now.getMonth() + 1) +
        '-' + now.getDate() + ':' + now.getHours() + ':' + now.getMinutes()
    var banner = '/*!\nbuilt in ' + snow + ' version ' + json.version + ' by 司徒正美\n' + feather + '\n\n*/'

    var code = banner + transform(result.code).
    replace(/\}\)\(undefined,/, '})(this,').
    replace(/avalon\$\d/g, 'avalon')

    //这个不需要了
    //  replace(/'use strict';?/g, '')
    fs.writeFileSync('./dist/avalon.tap.js', less(code));


}).catch(function(e) {
    console.log('error', e)
})