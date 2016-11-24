var rollup = require('rollup');
var fs = require('fs');
var babel = require("babel-core");
var transform = require('es3ify').transform;
var less = function(a){return a} //require('semicolon-less')

// used to track the cache for subsequent bundles
var cache;
var json = require('./package.json')
var v = 'version:' + JSON.stringify(json.version)
var sourcemaps = require('rollup-plugin-sourcemaps')

module.exports = rollup.rollup({
    // The bundle's starting point. This file will be
    // included, along with the minimum necessary code
    // from its dependencies

    entry: 'src/avalon.js',
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
        presets: ['es2015-loose', 'stage-0'],
        compact: false
    })

    function heredoc(fn) {
        return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
        replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
    }
    var feather = heredoc(function() {
        /*
https://github.com/RubyLouvre/avalon/tree/2.2.0
fix IE6-8 opacity BUG
减少VM的系统属性，__const__, __data__,__proxy__,$skipArray被废掉
vmodel模块全部重写，让它内部用到的私用方法更加合理
directives模块全部重写，因为现在不走react的渲染模板思路了
component模块全部重写，它现在是完全独立的作用域，可能与这前的有一点不兼容。不过，这对维护组件自身的状态非常有利。
$watch不再支持*号
strategy模块被打散了，细分为parser与renders与vtree这三个模块。renders里面有domRender与serverRender。
vdom模块，虚拟DOM转真实DOM时，对低版本浏览器的支持更好。
*/
    })
    var now = new Date
    var snow = now.getFullYear() + '-' + (now.getMonth() + 1) +
        '-' + now.getDate() + ':' + now.getHours()
    var banner = '/*!\nbuilt in ' + snow + ' version ' + json.version + ' by 司徒正美\n' + feather + '\n\n*/'

    var code = banner + transform(result.code).
    replace(/\}\)\(undefined,/, '})(this,').
    replace(/avalon\$\d/g, 'avalon')

    //这个不需要了
    //  replace(/'use strict';?/g, '')
    fs.writeFileSync('./dist/avalon.js', less(code));


}).catch(function(e) {
    console.log('error', e)
})