var rollup = require('rollup');
var fs = require('fs');
var istanbul = require('rollup-plugin-istanbul');
var babel = require("babel-core");
var less = require('semicolon-less')
var json = require('./package.json')
var v = 'version:' + JSON.stringify(json.version)

// used to track the cache for subsequent bundles
var cache;

module.exports = rollup.rollup({
    // The bundle's starting point. This file will be
    // included, along with the minimum necessary code
    // from its dependencies
    entry: 'src/avalon.modern.js',
    // If you have a bundle you want to re-use (e.g., when using a watcher to rebuild as files change),
    // you can tell rollup use a previous bundle as its starting point.
    // This is entirely optional!
    cache: cache,

    plugins: [
        //    istanbul({
        //      
        //      exclude: ['test/**/*.js']
        //    }),
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
    replace(/version\:\s*1/, v).
    replace(/avalon\$1/g, 'avalon')

    result = babel.transform(code, {
        presets: ['avalon'],
        compact: false
    })

    function heredoc(fn) {
        return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
        replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
    }
    var feather = heredoc(function() {
        /*
        https://github.com/RubyLouvre/avalon/tree/2.2.1
        添加计算属性
        添加事务
        内部所有类使用es6重写
        修正使用requirejs加载avalon2.2.0，返回空对象的BUG
        优化组件延迟定义的逻辑
        fromString进行性能优化
        fix 空字符串不生成节点的BUG
        确保onReady的执行时机，多个ms-controller套嵌，先执行里面的，再执行外面的   
        */
    })
    var now = new Date
    var snow = now.getFullYear() + '-' + (now.getMonth() + 1) +
        '-' + now.getDate() + ':' + now.getHours() + ':' + now.getMinutes()
    var banner = '/*!\nbuilt in ' + snow + ' version ' + json.version + ' by 司徒正美\n' + feather + '\n\n*/'
    code = banner + result.code.
    replace(/\}\)\(undefined,/, '})(this,')
        // replace(/'use strict';?/g, '')

    fs.writeFileSync('./dist/avalon.modern.js', less(code));
    // fs.writeFileSync( '../avalon-server-render-example/dist/avalon2.2.js', code );

}).catch(function(e) {
    console.log('error', e)
})